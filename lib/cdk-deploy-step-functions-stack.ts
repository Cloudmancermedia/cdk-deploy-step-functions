import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export class StepFunctionsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the HelloWorld Lambda function
    const helloWorldLambda = new lambda.Function(this, 'HelloWorldHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'hello-world.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Define a task that invokes the Lambda function
    const helloWorldTask = new tasks.LambdaInvoke(this, 'HelloWorldTask', {
      lambdaFunction: helloWorldLambda,
      outputPath: '$.Payload',
    });

    // Define a Pass state (no-op) as an example
    const passState = new sfn.Pass(this, 'PassState', {
      result: { value: 'This is a pass state' },
    });

    // Define a Succeed state
    const succeedState = new sfn.Succeed(this, 'SucceedState');

    // Define a Fail state
    const failState = new sfn.Fail(this, 'FailState', {
      error: 'Error',
      cause: 'Something went wrong',
    });

    // Define a Choice state
    const choiceState = new sfn.Choice(this, 'ChoiceState');
    choiceState.when(sfn.Condition.booleanEquals('$.success', true), succeedState);
    choiceState.when(sfn.Condition.booleanEquals('$.success', false), failState);

    // Define the state machine
    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: helloWorldTask.next(choiceState).next(passState),
    });

    new cdk.CfnOutput(this, 'StateMachineARN', {
      value: stateMachine.stateMachineArn,
    });
  }
}
