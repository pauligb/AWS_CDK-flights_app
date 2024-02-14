import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, Billing, Table, TableV2 } from "aws-cdk-lib/aws-dynamodb"


export class DatabaseStack extends cdk.Stack {
    public readonly usersTable: TableV2;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      
      this.usersTable = new TableV2(this, "UsersTable", {
        partitionKey: {
            name: "UserID",
            type: AttributeType.STRING,
        },
        tableName: "Users",
        billing: Billing.onDemand(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
      this.usersTable.addGlobalSecondaryIndex({
        indexName: "usernameIndex",
        partitionKey: {
            name: 'username',
            type: AttributeType.STRING,
        }
      });
    }
  }
  