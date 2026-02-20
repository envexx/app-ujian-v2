/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'lms-backend',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'ap-southeast-1',
        },
      },
    };
  },
  async run() {
    // API Gateway + Lambda
    const api = new sst.aws.ApiGatewayV2('LmsApi', {
      cors: {
        allowOrigins: [
          'http://localhost:3000',
          'https://*.pages.dev',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Lambda function
    const lambdaFunction = new sst.aws.Function('LmsBackend', {
      handler: 'src/lambda.handler',
      runtime: 'nodejs20.x',
      timeout: '30 seconds',
      memory: '512 MB',
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
        FRONTEND_URL: process.env.FRONTEND_URL || '',
        NODE_ENV: 'production',
      },
      nodejs: {
        install: ['@prisma/client', '@neondatabase/serverless'],
      },
    });

    // Route all requests to Lambda
    api.route('$default', lambdaFunction);

    return {
      api: api.url,
    };
  },
});
