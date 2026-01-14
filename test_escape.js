const isLaTeXContent = (text) => {
  const latexPatterns = [
    /\\\w+/,
    /\$.*?\$/,
    /\\[{}]/,
    /\\text\{/,
  ];
  return latexPatterns.some(pattern => pattern.test(text));
};

const escapeLaTeXText = (text) => {
  if (isLaTeXContent(text)) {
    return text.replace(/([&%])/g, '\\');
  }
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%0_{}]/g, '\\$&')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}');
};

console.log('Testing Palg_elab:', escapeLaTeXText('Palg_elab'));
console.log('Testing {alg}$:', escapeLaTeXText('$P_{alg}$'));
console.log('Testing Palg_elab with duplicate:', escapeLaTeXText('Palg_elab'));

