export const typeDefs = `
  scalar DateTime
  scalar JSON

  # User Types
  type User {
    id: ID!
    email: String!
    role: UserRole!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserRole {
    ADMIN
    VENDOR
    CUSTOMER
  }

  # Authentication Types
  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    role: UserRole = CUSTOMER
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # Vendor Types (Phase 1 basic structure)
  type Vendor {
    id: ID!
    name: String!
    region: String!
    description: String
    esgRating: Float!
    createdAt: DateTime!
  }

  input VendorFilter {
    region: String
    minEsgRating: Float
    maxEsgRating: Float
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
  }

  type VendorConnection {
    nodes: [Vendor!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  # AI Agent Types (Phase 1 basic structure)
  type ChatMessage {
    id: ID!
    message: String!
    response: String!
    timestamp: DateTime!
    user: User
    metadata: JSON
  }

  input ChatMessageInput {
    message: String!
    context: JSON
  }

  type ChatMessageResponse {
    chatMessage: ChatMessage
    success: Boolean!
    message: String!
  }

  type AIResponse {
    message: String!
    confidence: Float
    sources: [String!]
    processingTime: Int
    metadata: JSON
  }

  # Response Types
  type AuthResponse {
    user: User
    token: String
    success: Boolean!
    message: String!
  }

  type UserUpdateResponse {
    user: User
    success: Boolean!
    message: String!
  }

  type VendorResponse {
    vendor: Vendor
    success: Boolean!
    message: String!
  }

  type SimpleResponse {
    success: Boolean!
    message: String!
  }

  input UpdateProfileInput {
    email: String
    name: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input VendorInput {
    name: String!
    region: String!
    description: String
    esgRating: Float
  }

  # Root Query Type
  type Query {
    # User queries
    me: User
    users(filter: String): [User!]!
    
    # Vendor queries (basic for Phase 1)
    vendors(filter: VendorFilter, pagination: PaginationInput): VendorConnection!
    vendor(id: ID!): Vendor
    
    # AI Agent queries (basic for Phase 1)  
    chatMessage(message: String!): ChatMessage!
    chatHistory(limit: Int, offset: Int): [ChatMessage!]!
    
    # Health check
    health: String!
  }

  # Root Mutation Type
  type Mutation {
    # Authentication mutations
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    logout: SimpleResponse!
    
    # User mutations
    updateProfile(input: UpdateProfileInput!): UserUpdateResponse!
    changePassword(input: ChangePasswordInput!): SimpleResponse!
    
    # Vendor mutations
    createVendor(input: VendorInput!): VendorResponse!
    updateVendor(id: ID!, input: VendorInput!): VendorResponse!
    deleteVendor(id: ID!): SimpleResponse!
    
    # AI mutations
    sendChatMessage(input: ChatMessageInput!): ChatMessageResponse!
  }

  # Subscription Type (for future real-time features)
  type Subscription {
    userStatusChanged(userId: ID!): User!
    newVendorAdded: Vendor!
  }
`;