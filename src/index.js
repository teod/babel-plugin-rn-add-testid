const compose = (...functions) => (args) =>
  functions.reduceRight((arg, fn) => fn(arg), args);

const trim = (val) => (typeof val === 'string' ? val.trim() : val);

const toLowerCase = (val) =>
  typeof val === 'string' ? val.toLowerCase() : val;

const replace = (...args) => (val) =>
  typeof val === 'string' ? val.replace(...args) : val;

const replaceTabsAndSpaces = replace(/\s\s+/g, ' ');

const makeAccessId = compose(replaceTabsAndSpaces, trim);

const makeTestId = compose(
  replace(/\W/g, ''),
  replace(/\s/g, '_'),
  toLowerCase,
  makeAccessId
);

const checkForAttribute = (name, attributes) =>
  attributes.some(
    (attr) => attr && typeof attr.name === 'object' && attr.name.name === name
  );

let unknownCount = -1;

const defaultComponents = ['Text'];

module.exports = function (_ref, opts) {
  const t = _ref.types;

  const nameComps =
    Array.isArray(opts.components) && opts.components.length
      ? opts.components
      : defaultComponents;

  return {
    visitor: {
      JSXElement: {
        enter(path) {
          try {
            const nameComp = path.node.openingElement.name.name;
            if (nameComps.indexOf(nameComp) !== -1) {
              const { children } = path.node;

              // remove empty children
              const cookedChildren = children.filter((child) => {
                if (!child) {
                  return false;
                }

                if (child.type === 'JSXText') {
                  const { value: v } = child;

                  if (!v.trim()) {
                    return false;
                  }
                }

                if (child.type === 'JSXElement') {
                  return false;
                }

                return true;
              });

              const len = cookedChildren.length;

              let attributeValue = '';

              if (!len) {
                unknownCount++;
                attributeValue = t.stringLiteral(`unknown-${unknownCount}`);
              } else if (len === 1) {
                const [child] = cookedChildren;

                if (child.type === 'JSXExpressionContainer') {
                  attributeValue = child;
                }

                if (child.type === 'JSXText') {
                  attributeValue = t.stringLiteral(makeTestId(child.value));
                }
              } else if (
                cookedChildren.every(({ type }) => type === 'JSXText')
              ) {
                const joinedStringLiteral = cookedChildren.reduce(
                  (acc, child, index) => {
                    const { value: v } = child;

                    if (typeof v === 'string' && v) {
                      return `${acc}${v}`;
                    }

                    if (index === len - 1 && !acc) {
                      unknownCount++;
                      return [
                        ...acc,
                        t.stringLiteral(`unknown-${unknownCount}`),
                      ];
                    }

                    return acc;
                  },
                  ''
                );

                const testID = makeTestId(joinedStringLiteral);

                attributeValue = t.stringLiteral(testID);
              } else {
                const reducedChildren = cookedChildren.reduce(
                  (acc, child, index) => {
                    const { value: v, type } = child;

                    if (type === 'JSXText' && typeof v === 'string' && v) {
                      return [...acc, makeTestId(v)];
                    }

                    if (type === 'JSXExpressionContainer') {
                      return [...acc, child];
                    }

                    return acc;
                  },
                  []
                );

                const redChildrenLen = reducedChildren.length;

                if (!reducedChildren.length) {
                  unknownCount++;
                  attributeValue = t.stringLiteral(`unknown-${unknownCount}`);
                } else {
                  const possibleTailQuasis = [];

                  const expressions = reducedChildren.reduce(
                    (acc, child, idx) => {
                      if (child && child.type === 'JSXExpressionContainer') {
                        if (idx === reducedChildren.length - 1) {
                          possibleTailQuasis.push(
                            t.templateElement({ raw: '', cooked: '' }, true)
                          );
                        }

                        const {
                          expression: { name },
                        } = child;
                        return [...acc, t.identifier(name)];
                      }

                      return acc;
                    },
                    []
                  );

                  const rawQuasis = reducedChildren.reduce(
                    (acc, child, idx) => {
                      if (typeof child === 'string') {
                        const tail = idx === redChildrenLen - 1;

                        const raw = !tail ? `${child}_` : `_${child}`;

                        return [
                          ...acc,
                          t.templateElement({ raw, cooked: raw }, tail),
                        ];
                      }

                      return acc;
                    },
                    []
                  );

                  const possibleEmptyFront =
                    rawQuasis.length === expressions.length
                      ? [t.templateElement({ raw: '', cooked: '' }, false)]
                      : [];

                  const quasis = possibleTailQuasis.length
                    ? [...rawQuasis, ...possibleTailQuasis]
                    : [...possibleEmptyFront, ...rawQuasis];

                  const tmpltLiteral = t.templateLiteral(quasis, expressions);

                  attributeValue = t.JSXExpressionContainer(tmpltLiteral);
                }
              }

              const hasTestId = checkForAttribute(
                'testID',
                path.node.openingElement.attributes
              );
              const hasAccessibilityLabel = checkForAttribute(
                'accessibilityLabel',
                path.node.openingElement.attributes
              );

              if (Array.isArray(path.node.openingElement.attributes)) {
                if (!hasTestId) {
                  const testIdProp = t.jSXAttribute(
                    t.jSXIdentifier('testID'),
                    attributeValue
                  );

                  path.node.openingElement.attributes.push(testIdProp);
                }

                if (!hasAccessibilityLabel) {
                  const accessibilityLabel = t.jSXAttribute(
                    t.jSXIdentifier('accessibilityLabel'),
                    attributeValue
                  );

                  path.node.openingElement.attributes.push(accessibilityLabel);
                }
              }
            }
          } catch (err) {
            console.info(err);
          }
        },
      },
    },
  };
};
