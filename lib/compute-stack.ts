import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

interface ComputeStackProps extends cdk.StackProps {
    usersTable: TableV2;
};

export class ComputeStack extends cdk.Stack {
    readonly addUserToUsersTableFunc: NodejsFunction;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);
    this.addUserToUsersTableFunc = this.addUserToUsersTable(props);
  }

  addUserToUsersTable(props: ComputeStackProps) {
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
        ],
    }));
    return funct;
  }
}
