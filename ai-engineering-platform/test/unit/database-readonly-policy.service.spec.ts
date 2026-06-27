import { DatabaseReadonlyPolicyService } from '../../src/modules/database-intelligence/services/database-readonly-policy.service.js';

describe('DatabaseReadonlyPolicyService', () => {
  const policy = new DatabaseReadonlyPolicyService();

  it.each(['SELECT * FROM users', 'WITH active AS (SELECT * FROM users) SELECT * FROM active', 'PRAGMA table_info(users)'])(
    'allows read-only query: %s',
    (query) => {
      expect(() => policy.assertReadOnly(query)).not.toThrow();
    },
  );

  it.each(['INSERT INTO users VALUES (1)', 'UPDATE users SET name = "x"', 'DROP TABLE users', 'BEGIN TRANSACTION'])(
    'rejects mutation query: %s',
    (query) => {
      expect(() => policy.assertReadOnly(query)).toThrow();
    },
  );
});
