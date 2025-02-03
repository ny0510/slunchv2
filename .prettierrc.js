module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 300,

  // import 문 정렬
  importOrder: ['./'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  plugins: ['@trivago/prettier-plugin-sort-imports'],
};
