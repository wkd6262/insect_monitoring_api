import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Insect Monitoring API',
    description: '곤충 모니터링 API',
  },
  host: 'localhost:5000',
  schemes: ['http'],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  definitions: {
    AccountListSuccessResponse: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string' },
          password: { type: 'string', format: 'password' },
          user_level: { type: 'integer' },
          last_login_date: { type: 'string', format: 'date-time', nullable: true },
          created_date: { type: 'string', format: 'date-time' },
        },
      },
    },
    AccountInfoSuccessResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'string' },
        password: { type: 'string', format: 'password' },
        user_level: { type: 'integer' },
        last_login_date: { type: 'string', format: 'date-time', nullable: true },
        created_date: { type: 'string', format: 'date-time' },
      },
    },
    AccountSuccessResponse: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'integer', nullable: true },
            user_id: { type: 'string' },
            password: { type: 'string', format: 'password' },
            user_level: { type: 'integer' },
            last_login_date: { type: 'string', format: 'date-time', nullable: true },
            created_date: { type: 'string', format: 'date-time' },
          },
        },
        token: { type: 'string' },
      },
    },
    AccountFailedResponse: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        user: { type: 'null' },
        message: { type: 'string' },
      },
    },
    AddressListSuccessResponse: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          address_sido: { type: 'string' },
          address_gungu: { type: 'string' },
          address_dong: { type: 'string' },
        },
      },
    },
    CollectionHistory: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        device_id: { type: 'integer', nullable: true },
        insect_name: { type: 'string' },
        image_file: { type: 'string' },
        address_sido: { type: 'string' },
        address_gungu: { type: 'string' },
        address_dong: { type: 'string' },
        address_detail: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        collect_count: { type: 'integer' },
        status: { type: 'string', description: 'good | normal | warning | bad' },
        memo: { type: 'string' },
        created_date: { type: 'string', format: 'date-time' },
      },
    },
    CollectionHistoryListResponse: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          device_id: { type: 'integer', nullable: true },
          insect_name: { type: 'string' },
          image_file: { type: 'string' },
          address_sido: { type: 'string' },
          address_gungu: { type: 'string' },
          address_dong: { type: 'string' },
          address_detail: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          collect_count: { type: 'integer' },
          status: { type: 'string' },
          memo: { type: 'string' },
          created_date: { type: 'string', format: 'date-time' },
        },
      },
    },
    StatisticsSummaryResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        good_count: { type: 'integer' },
        normal_count: { type: 'integer' },
        warning_count: { type: 'integer' },
        bad_count: { type: 'integer' },
      },
    },
    GeneralSuccessResponse: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        message: { type: 'string' },
      },
    },
    GeneralFailedResponse: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

const outputFile = './swagger-output.json';
const routes = [
  './src/routes/account-router.ts',
  './src/routes/address-router.ts',
  './src/routes/collection-router.ts',
  './src/routes/statistics-router.ts',
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);
