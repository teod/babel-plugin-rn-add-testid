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
  toLowerCase
);

const checkForAttribute = (name, attributes) =>
  attributes.some(
    (attr) => attr && typeof attr.name === 'object' && attr.name.name === name
  );

let unknownCount = -1;

module.exports = function (_ref) {
  var t = _ref.types;
  return {
    visitor: {
      JSXElement: {
        enter(path) {
          const nameComp = path.node.openingElement.name.name;
          if (nameComp === 'Text') {
            const len = path.node.children.length;

            const val = path.node.children.reduce((acc, child, index) => {
              const { value: v, type } = child;

              const newVal =
                type === 'JSXText' && typeof v === 'string' && v
                  ? `${acc}${v}`
                  : acc;

              if (index === len - 1 && !newVal) {
                if (type === 'JSXExpressionContainer') {
                  return child;
                }

                unknownCount++;
                return `unknown-${unknownCount}`;
              }

              return newVal;
            }, '');

            const accessId = makeAccessId(val);
            const testId = makeTestId(accessId);

            const hasTestId = checkForAttribute(
              'testId',
              path.node.openingElement.attributes
            );
            const hasAccessibilityLabel = checkForAttribute(
              'accessibilityLabel',
              path.node.openingElement.attributes
            );

            if (Array.isArray(path.node.openingElement.attributes)) {
              if (!hasTestId && testId) {
                const testIdProp = t.jSXAttribute(
                  t.jSXIdentifier('testId'),
                  typeof testId === 'string' ? t.stringLiteral(testId) : testId
                );

                path.node.openingElement.attributes.push(testIdProp);
              }

              if (!hasAccessibilityLabel && accessId) {
                const accessibilityLabel = t.jSXAttribute(
                  t.jSXIdentifier('accessibilityLabel'),
                  typeof accessId === 'string'
                    ? t.stringLiteral(accessId)
                    : accessId
                );

                path.node.openingElement.attributes.push(accessibilityLabel);
              }
            }
          }
        },
      },
    },
  };
};
