// GraphQL Gateway schema validation tests  
import { buildSchema, validate, parse } from 'graphql';
import gql from 'graphql-tag';
import request from 'supertest';

const GRAPHQL_BASE_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';

describe('GraphQL Gateway - Schema Validation', () => {
  let schema;

  beforeAll(async () => {
    // Get the schema through introspection
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await request(GRAPHQL_BASE_URL)
      .post('/graphql')
      .send({ query: introspectionQuery });

    expect(response.status).toBe(200);
    expect(response.body.data.__schema).toBeTruthy();
    
    // Store schema data for validation tests
    schema = response.body.data.__schema;
  });

  describe('Schema Structure', () => {
    it('should have required root types', () => {
      expect(schema.queryType).toBeTruthy();
      expect(schema.queryType.name).toBe('Query');
      
      expect(schema.mutationType).toBeTruthy();
      expect(schema.mutationType.name).toBe('Mutation');
      
      // Subscription is optional for Phase 1
      if (schema.subscriptionType) {
        expect(schema.subscriptionType.name).toBe('Subscription');
      }
    });

    it('should define User type with required fields', () => {
      const userType = schema.types.find(t => t.name === 'User');
      expect(userType).toBeTruthy();
      expect(userType.kind).toBe('OBJECT');
      
      const fieldNames = userType.fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('role');
      
      // Verify field types
      const idField = userType.fields.find(f => f.name === 'id');
      expect(idField.type.kind).toBe('NON_NULL');
      expect(idField.type.ofType.name).toBe('ID');
      
      const emailField = userType.fields.find(f => f.name === 'email');
      expect(emailField.type.kind).toBe('NON_NULL');
      expect(emailField.type.ofType.name).toBe('String');
    });

    it('should define UserRole enum with valid values', () => {
      const roleEnum = schema.types.find(t => t.name === 'UserRole');
      expect(roleEnum).toBeTruthy();
      expect(roleEnum.kind).toBe('ENUM');
      
      const enumValues = roleEnum.enumValues.map(v => v.name);
      expect(enumValues).toContain('USER');
      expect(enumValues).toContain('ADMIN');
    });

    it('should define AuthPayload type', () => {
      const authPayload = schema.types.find(t => t.name === 'AuthPayload');
      expect(authPayload).toBeTruthy();
      expect(authPayload.kind).toBe('OBJECT');
      
      const fieldNames = authPayload.fields.map(f => f.name);
      expect(fieldNames).toContain('success');
      expect(fieldNames).toContain('message');
      expect(fieldNames).toContain('user');
      expect(fieldNames).toContain('token');
    });

    it('should define input types for mutations', () => {
      const registerInput = schema.types.find(t => t.name === 'RegisterInput');
      expect(registerInput).toBeTruthy();
      expect(registerInput.kind).toBe('INPUT_OBJECT');
      
      const fieldNames = registerInput.inputFields.map(f => f.name);
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('password');
      expect(fieldNames).toContain('role');
      
      const loginInput = schema.types.find(t => t.name === 'LoginInput');
      expect(loginInput).toBeTruthy();
      expect(loginInput.kind).toBe('INPUT_OBJECT');
      
      const loginFieldNames = loginInput.inputFields.map(f => f.name);
      expect(loginFieldNames).toContain('email');
      expect(loginFieldNames).toContain('password');
    });
  });

  describe('Query Operations', () => {
    it('should define me query', () => {
      const queryType = schema.types.find(t => t.name === 'Query');
      const meField = queryType.fields.find(f => f.name === 'me');
      
      expect(meField).toBeTruthy();
      expect(meField.type.name).toBe('User');
      expect(meField.args).toHaveLength(0);
    });

    it('should validate me query syntax', async () => {
      const meQuery = gql`
        query Me {
          me {
            id
            email
            role
          }
        }
      `;

      // Test that the query parses correctly
      expect(() => parse(meQuery)).not.toThrow();
    });

    it('should reject invalid field selections', async () => {
      const invalidQuery = gql`
        query InvalidFields {
          me {
            id
            nonExistentField
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: invalidQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/field.*nonExistentField/i);
    });
  });

  describe('Mutation Operations', () => {
    it('should define register mutation', () => {
      const mutationType = schema.types.find(t => t.name === 'Mutation');
      const registerField = mutationType.fields.find(f => f.name === 'register');
      
      expect(registerField).toBeTruthy();
      expect(registerField.type.name).toBe('AuthPayload');
      expect(registerField.args).toHaveLength(1);
      expect(registerField.args[0].name).toBe('input');
      expect(registerField.args[0].type.kind).toBe('NON_NULL');
      expect(registerField.args[0].type.ofType.name).toBe('RegisterInput');
    });

    it('should define login mutation', () => {
      const mutationType = schema.types.find(t => t.name === 'Mutation');
      const loginField = mutationType.fields.find(f => f.name === 'login');
      
      expect(loginField).toBeTruthy();
      expect(loginField.type.name).toBe('AuthPayload');
      expect(loginField.args).toHaveLength(1);
      expect(loginField.args[0].name).toBe('input');
      expect(loginField.args[0].type.kind).toBe('NON_NULL');
      expect(loginField.args[0].type.ofType.name).toBe('LoginInput');
    });

    it('should validate register mutation syntax', async () => {
      const registerMutation = gql`
        mutation RegisterUser($input: RegisterInput!) {
          register(input: $input) {
            success
            message
            user {
              id
              email
              role
            }
            token
          }
        }
      `;

      expect(() => parse(registerMutation)).not.toThrow();
    });

    it('should validate login mutation syntax', async () => {
      const loginMutation = gql`
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            message
            user {
              id
              email
              role
            }
            token
          }
        }
      `;

      expect(() => parse(loginMutation)).not.toThrow();
    });
  });

  describe('Type System Validation', () => {
    it('should enforce non-null constraints', async () => {
      const invalidMutation = gql`
        mutation RegisterWithoutInput {
          register {
            success
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: invalidMutation.loc.source.body
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/argument.*input.*required/i);
    });

    it('should validate enum values', async () => {
      const invalidRoleMutation = gql`
        mutation RegisterWithInvalidRole($input: RegisterInput!) {
          register(input: $input) {
            success
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: invalidRoleMutation.loc.source.body,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'password123',
              role: 'INVALID_ROLE'
            }
          }
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/enum.*role.*value/i);
    });

    it('should validate input object structure', async () => {
      const registerMutation = gql`
        mutation RegisterWithInvalidInput($input: RegisterInput!) {
          register(input: $input) {
            success
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: registerMutation.loc.source.body,
          variables: {
            input: {
              email: 'test@example.com',
              // Missing password field
              role: 'USER'
            }
          }
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/field.*password.*required/i);
    });

    it('should validate variable types', async () => {
      const registerMutation = gql`
        mutation RegisterWithWrongVariableType($input: String!) {
          register(input: $input) {
            success
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: registerMutation.loc.source.body,
          variables: {
            input: 'not-an-object'
          }
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/variable.*type|type.*mismatch/i);
    });
  });

  describe('Directive Support', () => {
    it('should support standard GraphQL directives', () => {
      const directiveNames = schema.directives.map(d => d.name);
      expect(directiveNames).toContain('skip');
      expect(directiveNames).toContain('include');
      expect(directiveNames).toContain('deprecated');
    });

    it('should handle conditional field inclusion', async () => {
      const conditionalQuery = gql`
        query ConditionalQuery($includeRole: Boolean!) {
          me {
            id
            email
            role @include(if: $includeRole)
          }
        }
      `;

      expect(() => parse(conditionalQuery)).not.toThrow();
    });
  });

  describe('Future Schema Extensions', () => {
    it('should be prepared for vendor types', () => {
      // This test documents expected future types
      // For now, we expect these to not exist yet
      const vendorType = schema.types.find(t => t.name === 'Vendor');
      const complianceType = schema.types.find(t => t.name === 'ComplianceReport');
      const carbonFootprintType = schema.types.find(t => t.name === 'CarbonFootprint');
      
      // These should not exist in Phase 1
      expect(vendorType).toBeFalsy();
      expect(complianceType).toBeFalsy();
      expect(carbonFootprintType).toBeFalsy();
    });

    it('should validate extensibility patterns', () => {
      // Verify that the schema is designed for extension
      const queryType = schema.types.find(t => t.name === 'Query');
      const mutationType = schema.types.find(t => t.name === 'Mutation');
      
      expect(queryType).toBeTruthy();
      expect(mutationType).toBeTruthy();
      
      // These types should be extensible (not sealed)
      expect(queryType.kind).toBe('OBJECT');
      expect(mutationType.kind).toBe('OBJECT');
    });
  });

  describe('Documentation and Descriptions', () => {
    it('should include field descriptions where available', () => {
      const userType = schema.types.find(t => t.name === 'User');
      
      if (userType && userType.description) {
        expect(typeof userType.description).toBe('string');
        expect(userType.description.length).toBeGreaterThan(0);
      }
      
      // Check if fields have descriptions
      const emailField = userType.fields.find(f => f.name === 'email');
      if (emailField && emailField.description) {
        expect(typeof emailField.description).toBe('string');
      }
    });

    it('should include enum value descriptions', () => {
      const roleEnum = schema.types.find(t => t.name === 'UserRole');
      
      if (roleEnum && roleEnum.enumValues[0] && roleEnum.enumValues[0].description) {
        expect(typeof roleEnum.enumValues[0].description).toBe('string');
      }
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent naming conventions', () => {
      const typeNames = schema.types
        .filter(t => !t.name.startsWith('__')) // Exclude introspection types
        .map(t => t.name);
      
      // All type names should be PascalCase
      typeNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    it('should have consistent field naming', () => {
      const userType = schema.types.find(t => t.name === 'User');
      const fieldNames = userType.fields.map(f => f.name);
      
      // Field names should be camelCase
      fieldNames.forEach(name => {
        expect(name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });

    it('should use appropriate scalar types', () => {
      const userType = schema.types.find(t => t.name === 'User');
      
      const idField = userType.fields.find(f => f.name === 'id');
      expect(idField.type.kind).toBe('NON_NULL');
      expect(idField.type.ofType.name).toBe('ID');
      
      const emailField = userType.fields.find(f => f.name === 'email');
      expect(emailField.type.kind).toBe('NON_NULL');
      expect(emailField.type.ofType.name).toBe('String');
    });
  });
});