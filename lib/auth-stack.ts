import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AuthStackProps extends cdk.StackProps {
    addUserPostConfirmation: NodejsFunction;
}

export class AuthStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);
        this.userPool = this.createUserPool(props);
        this.userPoolClient = this.createWebClient();
        this.output();
    }

    createUserPool(props: AuthStackProps) {
        const userPool = new cognito.UserPool(this, 'FlightsAppUserPool', {
            userPoolName: "FLIGHT-USERPOOL",
            selfSignUpEnabled: true,
            autoVerify: {
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: false,
                requireUppercase: false,
                requireDigits: false,
                requireSymbols: false,
            },
            signInAliases: {
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                }
            },
            customAttributes: {
                name: new cognito.StringAttribute({
                    minLen: 3,
                    maxLen: 20,
                })
            },
            lambdaTriggers: {
                postConfirmation: props.addUserPostConfirmation,
            }
        });
        return userPool;
    }

    createWebClient() {
        const userPoolClient = new cognito.UserPoolClient(this, 'FlgihtAppUserPoolClient', {
            userPool: this.userPool,
            authFlows: {
                userPassword: true,
                userSrp: true,
            }
        });
        return userPoolClient;
    }

    output() {
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
        })
    }
}
