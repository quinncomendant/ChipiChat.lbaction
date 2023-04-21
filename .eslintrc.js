module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': 'eslint:recommended',
    'overrides': [
    ],
    'parserOptions': {
        'ecmaVersion': 'latest'
    },
    'rules': {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['off', 'single'],
        'semi': ['error', 'always'],
        'no-underscore-dangle': 'off',
    },
    // Add the `globals` section to whitelist the global variables
    globals: {
        'Action': 'readonly',
        'Config': 'readonly',
        'config': 'writable',
        'Help': 'readonly',
        'help': 'writable',
        'HTTP': 'readonly',
        'include': 'writable',
        'LaunchBar': 'readonly',
        'module': 'writable',
        'OpenAI': 'readonly',
        'Parse': 'readonly',
        'parse': 'writable',
        'Persona': 'readonly',
        'persona': 'writable',
        'persona_defaults': 'writable',
        'run': 'readonly',
        'Util': 'readonly',
        'util': 'writable',
    }
};
