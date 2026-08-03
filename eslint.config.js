import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'android/**/*',
      'ios/**/*',
      'mobile/**/*',
      'temp/**/*',
      'temp_zip/**/*',
      'test_*/**/*',
      'node_modules/**/*',
      'scripts/**/*'
    ]
  },
  firebaseRulesPlugin.configs['flat/recommended']
];

