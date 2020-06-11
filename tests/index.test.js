const test = require('ava');
const babel = require('@babel/core');

const plugin = require('../src/index');

const entries = [
  '<Text>Big brown fox {value}</Text>',
  '<Text>{value} Big brown fox</Text>',
  '<Text>Big {value} brown fox </Text>',
  '<Text>Big brown fox</Text>',
  '<Text>{value}</Text>',
  '<Text>{value}    </Text>',
  '<Text>Big <Text>brown</Text> fox</Text>',
  '<Text />',
  '<Text>   </Text>',
  '<Text>        </Text>',
  '<Text>_Big_{value}_brown_fox_</Text>',
  '<Text testID="myID" accessibilityLabel="My Label">Big brown fox</Text>',
];

const expected = [
  '<Text testID={`big_brown_fox_${value}`} accessibilityLabel={`big_brown_fox_${value}`}>Big brown fox {value}</Text>;',
  '<Text testID={`${value}_big_brown_fox`} accessibilityLabel={`${value}_big_brown_fox`}>{value} Big brown fox</Text>;',
  '<Text testID={`big_${value}_brown_fox`} accessibilityLabel={`big_${value}_brown_fox`}>Big {value} brown fox </Text>;',
  '<Text testID="big_brown_fox" accessibilityLabel="big_brown_fox">Big brown fox</Text>;',
  '<Text testID={value} accessibilityLabel={value}>{value}</Text>;',
  '<Text testID={value} accessibilityLabel={value}>{value}    </Text>;',
  '<Text testID="big_fox" accessibilityLabel="big_fox">Big <Text testID="brown" accessibilityLabel="brown">brown</Text> fox</Text>;',
  '<Text testID="unknown-0" accessibilityLabel="unknown-0" />;',
  '<Text testID="unknown-1" accessibilityLabel="unknown-1">   </Text>;',
  '<Text testID="unknown-2" accessibilityLabel="unknown-2">        </Text>;',
  '<Text testID={`_big__${value}__brown_fox_`} accessibilityLabel={`_big__${value}__brown_fox_`}>_Big_{value}_brown_fox_</Text>;',
  '<Text testID="myID" accessibilityLabel="My Label">Big brown fox</Text>;',
];

test('plugin', (t) => {
  entries.forEach((entry, idx) => {
    const transformed = babel.transform(entry, {
      plugins: [plugin],
    });

    t.is(transformed.code, expected[idx])
  });
});
