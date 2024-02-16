import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';

interface ComputeStackProps extends cdk.StackProps {
    usersTable: TableV2;
    seatsTable: TableV2;
    flightTable: TableV2;
};

export class ComputeStack extends cdk.Stack {
    readonly addUserToUsersTableFunc: NodejsFunction;
    readonly bookingLambdaIntegration: LambdaIntegration;
    readonly registerBookingFun: NodejsFunction;
    readonly sendEmailFunc: NodejsFunction;
    readonly syncFlightRuleFunc: NodejsFunction;

    constructor(scope: Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);
        this.addUserToUsersTableFunc = this.addUserToUsersTable(props);
        this.bookingLambdaIntegration = this.bookSeats(props);
        this.registerBookingFun = this.registerBooking(props);
        this.syncFlightRuleFunc = this.syncFlights(props);
        this.sendEmailFunc = this.sendEmail(props);
    }

    addUserToUsersTable(props: ComputeStackProps): NodejsFunction{
        const funct = new NodejsFunction(this, "addUserFunc", {
            functionName: 'addUserFunc',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(
                __dirname,
                '../functions/AddUserPostConfirmation/index.ts'
            ),
        });
    
        funct.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                "dynamodb:PutItem",
            ],
            resources: [
                props.usersTable.tableArn as string
        ]   ,
        }));
    
        return funct;
    }

    bookSeats(props: ComputeStackProps): LambdaIntegration {
        const funct = new NodejsFunction(this, "addSeatsFunc", {
            functionName: 'Booking',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(
                __dirname,
                '../functions/Booking/index.ts'
            ),
        });
        funct.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "dynamodb:*",
                    "events:PutEvents"
                ],
                resources: [
                    props.seatsTable.tableArn,
                    "arn:aws:events:us-west-1:556866354801:event-bus/FlightBookingEventBus"
                ],
            })
        );
        return new LambdaIntegration(funct);
    }

    registerBooking(props: ComputeStackProps): NodejsFunction {
        const funct = new NodejsFunction(this, "registerBookingFunc", {
            functionName: 'RegisterBooking',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(
                __dirname,
                '../functions/Booking/registerBooking/index.ts'
            ),
        });
        funct.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "dynamodb:*",
                ],
                resources: [
                    props.seatsTable.tableArn,
                ],
            })
        );
        return funct;
    }

    syncFlights(props: ComputeStackProps): NodejsFunction {
        const funct = new NodejsFunction(this, "syncFlightsFunc", {
            functionName: 'SyncFlightsBooking',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(
                __dirname,
                '../functions/SyncFlights/index.ts'
            ),
        });
        funct.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "dynamodb:*",
                ],
                resources: [
                    props.seatsTable.tableArn,
                ],
            })
        );
        return funct;
    }

    sendEmail(props: ComputeStackProps): NodejsFunction {
        const funct = new NodejsFunction(this, "sendEmailFunc", {
            functionName: 'SendEmail',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(
                __dirname,
                '../functions/SendBookingEmail/index.ts'
            ),
        });
        funct.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [ "ses:*", "dynamodb:*" ],
                resources: [
                    props.usersTable.tableArn as string,
                    props.usersTable.tableArn + "/index/usernameIndex",
                    "*"
                ]     
            })
        )

        return funct;
    }
}
