import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Insect Monitoring API',
    description: 'API documentation',
  },
  host: 'api.moscom.co.kr',
  schemes: ['https'],
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
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "string" },
          password: { type: "string", format: "password" },
          user_level: { type: "integer" },
          last_login_date: { type: "string", format: "date-time", nullable: true },
          created_date: { type: "string", format: "date-time" },
          _count: { 
            type: "object",
            properties: {
              userDevices: { type: "integer" }
            }
          },
        }
      }
    },
    AccountInfoSuccessResponse: {
      type: "object",
      properties: {
        id: { type: "integer" },
        user_id: { type: "string" },
        password: { type: "string", format: "password" },
        user_level: { type: "integer" },
        last_login_date: { type: "string", format: "date-time", nullable: true },
        created_date: { type: "string", format: "date-time" },
        userDevices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              device: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  device_name: { type: "string" },
                  device_uuid: { type: "string" },
                  ip_address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  insect_count: { type: "integer" },
                  battery: { type: "integer" },
                  charge: { type: "integer" },
                  fan: { type: "integer" },
                  token_expired: { type: "string", format: "date-time", nullable: true },
                  device_date: { type: "string", format: "date-time" },
                  updated_date: { type: "string", format: "date-time", nullable: true },
                  created_date: { type: "string", format: "date-time" },
                }
              }
            }
          }
        }
      }
    },
    AccountSuccessResponse: {
      type: "object",
      properties: {
        type: { type: "string" },
        user: {
          type: "object", 
          properties: {
            id: { type: "integer", nullable: true },
            user_id: { type: "string" },
            password: { type: "string", format: "password" },
            user_level: { type: "integer" },
            last_login_date: { type: "string", format: "date-time", nullable: true },
            created_date: { type: "string", format: "date-time" }
          }
        },
        token: { type: "string" }
      }
    },
    AccountFailedResponse: {
      type: "object", 
      properties: {
        type: { type: "string" },
        user: { type: "null" },
        message: { type: "string" }
      }
    },
    DeviceGroupListSuccessResponse: {
      type: "array",
      items: {
        type: "object",
        properties: {
          device_group_id: { type: "integer", nullable: true },
          deviceGroup: {
            type: "object",
            properties: {
              id: { type: "integer", nullable: true },
              group_name: { type: "string" },
              created_date: { type: "string", format: "date-time" }
            }
          }
        }
      }
    },
    DeviceListSuccessResponse: {
      type: "array",
      items: {
        type: "object",
        properties: {
          device: {
            type: "object", 
            properties: {
              id: { type: "integer", nullable: true },
              device_group_id: { type: "integer"},
              device_name: { type: "string" },
              device_uuid: { type: "string" },
              ip_address: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              insect_count: { type: "integer" },
              battery: { type: "integer" },
              charge: { type: "integer" },
              fan: { type: "integer" },
              token_expired: { type: "string", format: "date-time", nullable: true },
              device_date: { type: "string", format: "date-time" },
              updated_date: { type: "string", format: "date-time", nullable: true },
              created_date: { type: "string", format: "date-time" },
            }
          },
          device_group: {
            type: "object",
            properties: {
              id: { type: "integer", nullable: true },
              group_name: { type: "string" },
              created_date: { type: "string", format: "date-time" }
            }
          }
        }
      }
    },
    DeviceGroupSuccessResponse: {
      type: "object",
      properties: {
        id: { type: "integer", nullable: true },
        group_name: { type: "string" },
        created_date: { type: "string", format: "date-time" }
      }
    },
    DeviceGetSuccessResponse: {
      type: "object",
      properties: {
        device: {
          type: "object",
          properties: {
            id: { type: "integer", nullable: true },
            device_group_id: { type: "integer"},
            device_name: { type: "string" },
            device_uuid: { type: "string" },
            ip_address: { type: "string" },
            latitude: { type: "number" }, 
            longitude: { type: "number" },
            insect_count: { type: "integer" },
            battery: { type: "integer" },
            charge: { type: "integer" },
            fan: { type: "integer" },
            token_expired: { type: "string", format: "date-time", nullable: true },
            device_date: { type: "string", format: "date-time" },
            updated_date: { type: "string", format: "date-time", nullable: true },
            created_date: { type: "string", format: "date-time" },
          }
        },
        device_group: {
          type: "object", 
          properties: {
            id: { type: "integer", nullable: true },
            group_name: { type: "string" },
            created_date: { type: "string", format: "date-time" }
          }
        }
      }
    },
    DeviceSuccessResponse: {
      type: "object",
      properties: {
        id: { type: "integer", nullable: true },
        device_group_id: { type: "integer"},
        device_name: { type: "string" },
        device_uuid: { type: "string" },
        ip_address: { type: "string" },
        latitude: { type: "number" }, 
        longitude: { type: "number" },
        insect_count: { type: "integer" },
        battery: { type: "integer" },
        charge: { type: "integer" },
        fan: { type: "integer" },
        token_expired: { type: "string", format: "date-time", nullable: true },
        device_date: { type: "string", format: "date-time" },
        updated_date: { type: "string", format: "date-time", nullable: true },
        created_date: { type: "string", format: "date-time" },
      }
    },
    ListByCountSuccessResponse: {
      type: "array",
      items: {
        type: "object",
        properties: {
          device_group_id: { type: "integer"},
          device_id: { type: "integer"},
          count: { type: "integer"},
        }
      }
    },
    SummarySuccessResponse: {
      type: "object",
      properties: {
        device_group_id: { type: "integer" },
        device_count: { type: "integer" },
        online_count: { type: "integer" },
        offline_count: { type: "integer" },
        warning_count: { type: "integer" },
        insect_count: { type: "integer" },
      }
    },
    StatisticsSuccessResponse: {
      type: "array",
      items: { 
        type: "object",
        properties: {
          id: { type: "integer" },
          device_id: { type: "integer" },
          device_uuid: { type: "string" },
          insect_count: { type: "integer" },
          created_date: { type: "string", format: "date-time" },
        }
      }
    },
    ControlSuccessResponse: {
      type: "string",
      properties: {
        status: { type: "string" },
      }
    },
    WebHookAuthSuccessResponse: {
      type: "object",
      properties: {
        status: { type: "string" },
        token: { type: "string" },
        expires_in: { type: "number" }
      }
    },
    WebHookAuthFailedResponse: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" }
      } 
    },
    WebHookDeviceSuccessResponse: {
      type: "object",
      properties: {
        status: { type: "string" },
      }
    },
    WebHookDeviceFailedResponse: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" }
      } 
    },
    GeneralFailedResponse: {
      type: "object",
      properties: {
        type: { type: "string" },
        message: { type: "string" }
      }
    },
  },
};

const outputFile = './swagger-output.json';
const routes = [
    './src/routes/account-router.ts',
    './src/routes/device-router.ts',
    './src/routes/webhook-router.ts',
];

swaggerAutogen({ openapi: "3.0.0"})(outputFile, routes, doc);