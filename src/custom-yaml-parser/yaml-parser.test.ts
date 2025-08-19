import { parseYamlFile, parseYamlString } from './yaml-parser';
import { generateYamlFromJsonWithMetadata } from './yaml-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('YAML Parser with Metadata', () => {
  describe('Basic YAML parsing', () => {
    test('should parse simple YAML without anchors', () => {
      const yamlContent = `
        name: John Doe
        age: 30
        active: true
      `;

      const result = parseYamlString(yamlContent);

      expect(result).toEqual({
        name: 'John Doe',
        age: 30,
        active: true
      });
    });

    test('should handle empty YAML', () => {
      const yamlContent = '';
      const result = parseYamlString(yamlContent);

      expect(result).toEqual({});
    });

    test('should parse arrays', () => {
      const yamlContent = `
        fruits:
          - apple
          - banana
          - orange
      `;

      const result = parseYamlString(yamlContent);

      expect(result).toEqual({
        fruits: ['apple', 'banana', 'orange']
      });
    });
  });

  describe('Anchors and References', () => {
    test('should add anchor metadata to anchored nodes', () => {
      const yamlContent = `
        defaults:
          user_profile: &default-user
            role: guest
            timezone: UTC
      `;

      const result = parseYamlString(yamlContent);

      expect(result.defaults.user_profile).toHaveProperty('anchor', 'default-user');
      expect(result.defaults.user_profile.role).toBe('guest');
      expect(result.defaults.user_profile.timezone).toBe('UTC');
    });

    test('should handle merge key references', () => {
      const yamlContent = `
        defaults:
          user: &default-user
            role: guest
            active: true
        
        users:
          - username: charlie
            <<: *default-user
      `;

      const result = parseYamlString(yamlContent);

      expect(result.users[0]).toHaveProperty('referenceOf', 'default-user');
      expect(result.users[0].role).toBe('guest');
      expect(result.users[0].active).toBe(true);
      expect(result.users[0].username).toBe('charlie');
    });

    test('should handle property overrides with merge keys', () => {
      const yamlContent = `
        defaults:
          user: &default-user
            role: guest
            level: 1
        
        users:
          - username: admin
            <<: *default-user
            role: admin
            level: 10
      `;

      const result = parseYamlString(yamlContent);

      expect(result.users[0].referenceOf).toBe('default-user');
      expect(result.users[0].role).toBe('admin'); // Override
      expect(result.users[0].level).toBe(10); // Override
      expect(result.users[0].username).toBe('admin');
    });

    test('should handle nested anchors and references', () => {
      const yamlContent = `
        defaults:
          notifications: &default-notifications
            email: true
            sms: false
          
          user: &default-user
            role: guest
            notifications:
              <<: *default-notifications
        
        users:
          - <<: *default-user
            username: test
      `;

      const result = parseYamlString(yamlContent);

      expect(result.defaults.notifications).toHaveProperty('anchor', 'default-notifications');
      expect(result.defaults.user).toHaveProperty('anchor', 'default-user');
      expect(result.users[0]).toHaveProperty('referenceOf', 'default-user');
    });
  });

  describe('Complex scenarios', () => {
    test('should handle multiple merge keys', () => {
      // Note: YAML spec says duplicate keys aren't allowed, so we test with a single merge
      const yamlContent = `
        base1: &base1
          prop1: value1
          prop2: value2
        
        merged:
          <<: *base1
          prop3: value3
      `;

      const result = parseYamlString(yamlContent);

      expect(result.merged).toHaveProperty('referenceOf', 'base1');
      expect(result.merged.prop1).toBe('value1');
      expect(result.merged.prop2).toBe('value2');
      expect(result.merged.prop3).toBe('value3');
    });

    test('should parse the sample YAML file correctly', () => {
      const yamlPath = path.join(__dirname, 'yaml-sample.yaml');
      const expectedJsonPath = path.join(__dirname, 'json-yaml-expected.json');

      const expectedJson = JSON.parse(fs.readFileSync(expectedJsonPath, 'utf8'));

      const result = parseYamlFile(yamlPath);

      expect(result).toEqual(expectedJson);
    });

    test('should parse the sample YAML file correctly complex-yaml-sample01.yaml', () => {
      const yamlPath = path.join(__dirname, 'complex-yaml-sample.yaml');

      const result = parseYamlFile(yamlPath);
      console.log(JSON.stringify(result));
      expect(result).toBeDefined();
    });

    test('should parse the sample YAML file correctly complex-yaml-sample02.yaml', () => {
      const yamlPath = path.join(__dirname, 'complex-yaml-sample02.yaml');

      const result = parseYamlFile(yamlPath);
      console.log(JSON.stringify(result));
      expect(result).toBeDefined();
    });

  });

  describe('Edge cases', () => {
    test('should handle null values', () => {
      const yamlContent = `
        nullValue: null
        emptyValue: ~
      `;

      const result = parseYamlString(yamlContent);

      expect(result.nullValue).toBeNull();
      expect(result.emptyValue).toBeNull();
    });

    test('should handle boolean values', () => {
      const yamlContent = `
        truthy: true
        falsy: false
        yes: yes
        no: no
      `;

      const result = parseYamlString(yamlContent);

      expect(result.truthy).toBe(true);
      expect(result.falsy).toBe(false);
      expect(result.yes).toBe('yes');
      expect(result.no).toBe('no');
    });

    test('should handle numbers', () => {
      const yamlContent = `
        integer: 42
        float: 3.14
        negative: -10
        scientific: 1.2e3
      `;

      const result = parseYamlString(yamlContent);

      expect(result.integer).toBe(42);
      expect(result.float).toBe(3.14);
      expect(result.negative).toBe(-10);
      expect(result.scientific).toBe(1200);
    });

    test('should handle multi-line strings', () => {
      const yamlContent = `
        literal: |
          Line 1
          Line 2
        folded: >
          This is
          a folded string
      `;

      const result = parseYamlString(yamlContent);

      expect(result.literal).toContain('Line 1');
      expect(result.literal).toContain('Line 2');
      expect(result.folded).toContain('This is a folded string');
    });

    test('should handle direct alias references', () => {
      const yamlContent = `
        original: &myanchor
          key: value
        
        reference: *myanchor
      `;

      const result = parseYamlString(yamlContent);

      expect(result.original).toHaveProperty('anchor', 'myanchor');
      expect(result.reference).toHaveProperty('referenceOf', 'myanchor');
      expect(result.reference.key).toBe('value');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid YAML gracefully', () => {
      const yamlContent = `
        invalid: [
          missing: bracket
      `;

      expect(() => {
        parseYamlString(yamlContent);
      }).toThrow('YAML parsing errors');
    });

    test('should handle undefined anchor references', () => {
      const yamlContent = `
        reference: *nonexistent
      `;

      // The YAML library should handle this and throw an error
      expect(() => {
        parseYamlString(yamlContent);
      }).toThrow();
    });
  });

  describe('File parsing', () => {
    test('should parse a file correctly', () => {
      const yamlPath = path.join(__dirname, 'yaml-sample.yaml');

      const result = parseYamlFile(yamlPath);

      expect(result).toBeDefined();
      expect(result.defaults).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.environments).toBeDefined();
    });

    test('should throw error for non-existent file', () => {
      const nonExistentPath = path.join(__dirname, 'non-existent.yaml');

      expect(() => {
        parseYamlFile(nonExistentPath);
      }).toThrow();
    });
  });
});
