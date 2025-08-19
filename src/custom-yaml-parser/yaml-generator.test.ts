import { generateYamlFromJsonWithMetadata } from './yaml-generator';
import { parseYamlString } from './yaml-parser';
import path from 'path';
import fs from 'fs';


describe('YAML Generator', () => {



  describe('test yaml files', () => {
    test('simple json to yaml', () => {
      const jsonPath = path.join(__dirname, 'json-yaml-expected.json');

      // Read file as string, then parse
      const rawJsonContent = fs.readFileSync(jsonPath, 'utf8');
      const jsonContent = JSON.parse(rawJsonContent);

      const result = generateYamlFromJsonWithMetadata(jsonContent);

      console.log(JSON.stringify(result));
      expect(result).toBeDefined();
    });

    test('complex json to yaml', () => {
      const jsonPath = path.join(__dirname, 'complex-sample-01.json');

      // Read file as string, then parse
      const rawJsonContent = fs.readFileSync(jsonPath, 'utf8');
      const jsonContent = JSON.parse(rawJsonContent);

      const result = generateYamlFromJsonWithMetadata(jsonContent);

      console.log(JSON.stringify(result));
      expect(result).toBeDefined();
    });
  });

  describe('generateYamlFromJsonWithMetadata', () => {
    test('should generate simple YAML without anchors or references', () => {
      const jsonInput = {
        name: 'John Doe',
        age: 30,
        active: true,
        address: {
          street: '123 Main St',
          city: 'Anytown'
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('name: John Doe');
      expect(result).toContain('age: 30');
      expect(result).toContain('active: true');
      expect(result).toContain('address:');
      expect(result).toContain('street: "123 Main St"');
      expect(result).toContain('city: Anytown');
    });

    test('should generate YAML with anchor definitions', () => {
      const jsonInput = {
        defaults: {
          user_profile: {
            role: 'guest',
            timezone: 'UTC',
            anchor: 'default-user'
          }
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('user_profile: &default-user');
      expect(result).toContain('role: guest');
      expect(result).toContain('timezone: UTC');
      expect(result).not.toContain('anchor:');
    });

    test('should generate YAML with direct references', () => {
      const jsonInput = {
        original: {
          key: 'value',
          anchor: 'myanchor'
        },
        reference: {
          key: 'value',
          referenceOf: 'myanchor'
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('original: &myanchor');
      expect(result).toContain('<<: *myanchor');
      expect(result).not.toContain('referenceOf:');
    });

    test('should generate YAML with merge key references', () => {
      const jsonInput = {
        defaults: {
          user: {
            role: 'guest',
            active: true,
            anchor: 'default-user'
          }
        },
        users: [
          {
            role: 'guest',
            active: true,
            referenceOf: 'default-user',
            username: 'charlie'
          }
        ]
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('user: &default-user');
      expect(result).toContain('- <<: *default-user');
      expect(result).toContain('username: charlie');
    });

    test('should handle nested objects with anchors and references', () => {
      const jsonInput = {
        defaults: {
          database: {
            host: 'localhost',
            port: 5432,
            anchor: 'db-config'
          }
        },
        environments: {
          development: {
            database: {
              host: 'localhost',
              port: 5432,
              referenceOf: 'db-config',
              database_name: 'dev_db'
            }
          }
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('database: &db-config');
      expect(result).toContain('<<: *db-config');
      expect(result).toContain('database_name: dev_db');
    });

    test('should handle arrays with references', () => {
      const jsonInput = {
        base_config: {
          name: 'base',
          value: 100,
          anchor: 'base'
        },
        items: [
          {
            name: 'base',
            value: 100,
            referenceOf: 'base',
            id: 1
          },
          {
            name: 'item2',
            value: 200
          }
        ]
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('base_config: &base');
      expect(result).toContain('- <<: *base');
      expect(result).toContain('id: 1');
      expect(result).toContain('name: item2');
      expect(result).toContain('value: 200');
    });

    test('should handle complex nested structures', () => {
      const jsonInput = {
        security: {
          encryption: {
            algorithm: 'AES-256-GCM',
            key_size: 256,
            anchor: 'encryption-config'
          }
        },
        services: {
          web_service: {
            security: {
              encryption: {
                algorithm: 'AES-256-GCM',
                key_size: 256,
                referenceOf: 'encryption-config',
                enabled: true
              }
            }
          }
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('encryption: &encryption-config');
      expect(result).toContain('<<: *encryption-config');
      expect(result).toContain('enabled: true');
    });

    test('should handle null and undefined values', () => {
      const jsonInput = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        config: {
          setting: null,
          anchor: 'config'
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('nullValue: null');
      expect(result).toContain('undefinedValue: null');
      expect(result).toContain('emptyString:');
      expect(result).toContain('config: &config');
      expect(result).toContain('setting: null');
    });

    test('should handle boolean and numeric values correctly', () => {
      const jsonInput = {
        enabled: true,
        disabled: false,
        count: 42,
        price: 19.99,
        negative: -10,
        scientific: 1.2e3
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('enabled: true');
      expect(result).toContain('disabled: false');
      expect(result).toContain('count: 42');
      expect(result).toContain('price: 19.99');
      expect(result).toContain('negative: -10');
      expect(result).toContain('scientific: 1200');
    });

    test('should quote strings that need quoting', () => {
      const jsonInput = {
        normalString: 'hello',
        stringWithColon: 'key: value',
        numberString: '123',
        booleanString: 'true',
        nullString: 'null'
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('normalString: hello');
      expect(result).toContain('stringWithColon: "key: value"');
      expect(result).toContain('numberString: "123"');
      expect(result).toContain('booleanString: "true"');
      expect(result).toContain('nullString: "null"');
    });

    test('should handle empty arrays and objects', () => {
      const jsonInput = {
        emptyArray: [],
        emptyObject: {},
        nestedEmpty: {
          array: [],
          object: {}
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('emptyArray:');
      expect(result).toContain('emptyObject:');
      expect(result).toContain('nestedEmpty:');
    });

    test('should preserve indentation correctly', () => {
      const jsonInput = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              anchor: 'deep-config'
            }
          }
        },
        reference: {
          level3: {
            value: 'deep',
            referenceOf: 'deep-config',
            extra: 'data'
          }
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);
      const lines = result.split('\n');

      // Check indentation levels
      expect(lines.some(line => line.startsWith('level1:'))).toBe(true);
      expect(lines.some(line => line.startsWith('  level2:'))).toBe(true);
      expect(lines.some(line => line.startsWith('    level3: &deep-config'))).toBe(true);
      expect(lines.some(line => line.startsWith('      value: deep'))).toBe(true);
    });

    test('should generate valid YAML that can be parsed back', () => {
      const jsonInput = {
        defaults: {
          user_profile: {
            role: 'guest',
            timezone: 'UTC',
            notifications: {
              email: true,
              sms: false
            },
            anchor: 'default-user'
          }
        },
        users: [
          {
            role: 'guest',
            timezone: 'UTC',
            notifications: {
              email: true,
              sms: false
            },
            referenceOf: 'default-user',
            username: 'alice'
          },
          {
            role: 'admin',
            timezone: 'UTC',
            notifications: {
              email: true,
              sms: true
            },
            referenceOf: 'default-user',
            username: 'bob',
            department: 'IT'
          }
        ]
      };

      const generatedYaml = generateYamlFromJsonWithMetadata(jsonInput);

      // The generated YAML should be parseable
      expect(() => {
        parseYamlString(generatedYaml);
      }).not.toThrow();

      const parsedBack = parseYamlString(generatedYaml);

      // Should have the expected structure
      expect(parsedBack.defaults).toBeDefined();
      expect(parsedBack.users).toBeDefined();
      expect(parsedBack.defaults.user_profile.anchor).toBe('default-user');
      expect(parsedBack.users[0].referenceOf).toBe('default-user');
      expect(parsedBack.users[0].username).toBe('alice');
      expect(parsedBack.users[1].username).toBe('bob');
      expect(parsedBack.users[1].department).toBe('IT');
    });

    test('should include header comment', () => {
      const jsonInput = {
        simple: 'value'
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toMatch(/^# Generated YAML from JSON with anchors and references/);
    });

    test('should handle multiple anchors in the same document', () => {
      const jsonInput = {
        config1: {
          setting1: 'value1',
          anchor: 'config-one'
        },
        config2: {
          setting2: 'value2',
          anchor: 'config-two'
        },
        usage: {
          first: {
            setting1: 'value1',
            referenceOf: 'config-one'
          },
          second: {
            setting2: 'value2',
            referenceOf: 'config-two'
          }
        }
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('config1: &config-one');
      expect(result).toContain('config2: &config-two');
      expect(result).toContain('<<: *config-one');
      expect(result).toContain('<<: *config-two');
    });

    test('should handle array of objects with mixed references', () => {
      const jsonInput = {
        templates: {
          basic: {
            name: 'basic',
            type: 'template',
            anchor: 'basic-template'
          },
          advanced: {
            name: 'advanced',
            type: 'template',
            anchor: 'advanced-template'
          }
        },
        instances: [
          {
            name: 'basic',
            type: 'template',
            referenceOf: 'basic-template',
            id: 'instance-1'
          },
          {
            name: 'advanced',
            type: 'template',
            referenceOf: 'advanced-template',
            id: 'instance-2',
            extra_config: {
              debug: true
            }
          },
          {
            name: 'custom',
            type: 'custom',
            id: 'instance-3'
          }
        ]
      };

      const result = generateYamlFromJsonWithMetadata(jsonInput);

      expect(result).toContain('basic: &basic-template');
      expect(result).toContain('advanced: &advanced-template');
      expect(result).toContain('- <<: *basic-template');
      expect(result).toContain('id: instance-1');
      expect(result).toContain('- <<: *advanced-template');
      expect(result).toContain('id: instance-2');
      expect(result).toContain('debug: true');
      expect(result).toContain('name: custom');
      expect(result).toContain('id: instance-3');
    });
  });
});
