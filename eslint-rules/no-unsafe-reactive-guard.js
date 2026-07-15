import ts from 'typescript'

function unwrapExpression(node) {
  let current = node

  while (
    current?.type === 'ChainExpression' ||
    current?.type === 'TSAsExpression' ||
    current?.type === 'TSNonNullExpression' ||
    current?.type === 'TSTypeAssertion'
  ) {
    current = current.expression
  }

  return current
}

function isNullishLiteral(node) {
  const expression = unwrapExpression(node)

  return (
    (expression?.type === 'Literal' && expression.value === null) ||
    (expression?.type === 'Identifier' && expression.name === 'undefined')
  )
}

function getNarrowedExpression(node) {
  const expression = unwrapExpression(node)

  if (!expression) return null

  if (expression.type === 'UnaryExpression' && expression.operator === '!') {
    return getNarrowedExpression(expression.argument)
  }

  if (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'Identifier' &&
    expression.callee.name === 'Boolean' &&
    expression.arguments.length === 1
  ) {
    return getNarrowedExpression(expression.arguments[0])
  }

  if (
    expression.type === 'BinaryExpression' &&
    ['!=', '!=='].includes(expression.operator)
  ) {
    if (isNullishLiteral(expression.left)) {
      return getNarrowedExpression(expression.right)
    }

    if (isNullishLiteral(expression.right)) {
      return getNarrowedExpression(expression.left)
    }
  }

  return expression
}

function getFalseBranchNarrowedExpression(node) {
  const expression = unwrapExpression(node)

  if (!expression) return null

  if (expression.type === 'UnaryExpression' && expression.operator === '!') {
    return getNarrowedExpression(expression.argument)
  }

  if (
    expression.type === 'BinaryExpression' &&
    ['==', '==='].includes(expression.operator)
  ) {
    if (isNullishLiteral(expression.left)) {
      return getNarrowedExpression(expression.right)
    }

    if (isNullishLiteral(expression.right)) {
      return getNarrowedExpression(expression.left)
    }
  }

  return null
}

function expressionsAreEqual(leftNode, rightNode) {
  const left = unwrapExpression(leftNode)
  const right = unwrapExpression(rightNode)

  if (!left || !right || left.type !== right.type) return false

  if (left.type === 'Identifier') {
    return left.name === right.name
  }

  if (left.type === 'ThisExpression') return true

  if (left.type === 'Literal') {
    return left.value === right.value
  }

  if (left.type === 'MemberExpression') {
    return (
      left.computed === right.computed &&
      expressionsAreEqual(left.object, right.object) &&
      expressionsAreEqual(left.property, right.property)
    )
  }

  if (left.type === 'CallExpression') {
    return (
      left.arguments.length === 0 &&
      right.arguments.length === 0 &&
      expressionsAreEqual(left.callee, right.callee)
    )
  }

  return false
}

function getShowCondition(node) {
  const name = node.openingElement.name

  if (name.type !== 'JSXIdentifier' || name.name !== 'Show') return null

  const whenAttribute = node.openingElement.attributes.find(
    (attribute) =>
      attribute.type === 'JSXAttribute' &&
      attribute.name.type === 'JSXIdentifier' &&
      attribute.name.name === 'when',
  )

  if (
    !whenAttribute ||
    !whenAttribute.value ||
    whenAttribute.value.type !== 'JSXExpressionContainer'
  ) {
    return null
  }

  return getNarrowedExpression(whenAttribute.value.expression)
}

function typeCanBeNullish(context, node) {
  const services = context.sourceCode.parserServices

  if (!services.program || !services.esTreeNodeToTSNodeMap) return true

  const typescriptNode = services.esTreeNodeToTSNodeMap.get(node)

  if (!typescriptNode) return true

  const checker = services.program.getTypeChecker()
  const type = checker.getTypeAtLocation(typescriptNode)

  function includesNullish(typeToCheck) {
    if (
      typeToCheck.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)
    ) {
      return true
    }

    return typeToCheck.isUnion() && typeToCheck.types.some(includesNullish)
  }

  return includesNullish(type)
}

function isEvaluatedByJsx(node) {
  let ancestor = node.parent

  while (ancestor) {
    if (ancestor.type === 'JSXExpressionContainer') return true

    if (
      ancestor.type === 'ArrowFunctionExpression' ||
      ancestor.type === 'FunctionExpression' ||
      ancestor.type === 'FunctionDeclaration'
    ) {
      return false
    }

    ancestor = ancestor.parent
  }

  return false
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent nullable reactive JSX guards from being dereferenced again in lazy Solid getters',
    },
    schema: [],
    messages: {
      unsafeDereference:
        'Do not dereference a nullable reactive JSX guard inside its guarded subtree. Capture a stable value first; for <Show>, consume its callback value (usually with keyed).',
    },
  },
  create(context) {
    const reportedGuards = new WeakSet()

    function reportIfUnsafe(node, guard, condition) {
      if (
        condition &&
        typeCanBeNullish(context, condition) &&
        expressionsAreEqual(node.object, condition) &&
        !reportedGuards.has(guard)
      ) {
        reportedGuards.add(guard)
        context.report({
          node,
          messageId: 'unsafeDereference',
        })
      }
    }

    return {
      MemberExpression(node) {
        if (node.optional) return

        let child = node
        let ancestor = node.parent

        while (ancestor) {
          if (ancestor.type === 'JSXElement') {
            reportIfUnsafe(node, ancestor, getShowCondition(ancestor))
          } else if (
            ancestor.type === 'LogicalExpression' &&
            ancestor.operator === '&&' &&
            child === ancestor.right &&
            isEvaluatedByJsx(ancestor)
          ) {
            reportIfUnsafe(
              node,
              ancestor,
              getNarrowedExpression(ancestor.left),
            )
          } else if (
            ancestor.type === 'ConditionalExpression' &&
            (child === ancestor.consequent || child === ancestor.alternate) &&
            isEvaluatedByJsx(ancestor)
          ) {
            reportIfUnsafe(
              node,
              ancestor,
              child === ancestor.consequent
                ? getNarrowedExpression(ancestor.test)
                : getFalseBranchNarrowedExpression(ancestor.test),
            )
          }

          child = ancestor
          ancestor = ancestor.parent
        }
      },
    }
  },
}
