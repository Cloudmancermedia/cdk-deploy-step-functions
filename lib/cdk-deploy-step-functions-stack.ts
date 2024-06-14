import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Choice, Condition, DefinitionBody, Fail, Pass, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class CdkDeployStepFunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define the HelloWorld Lambda function
    const helloWorldLambda = new NodejsFunction(this, 'HelloWorldHandler', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lib/lambda/hello-world.ts',
      handler: 'handler',
    });

    // Define a task that invokes the Lambda function
    const helloWorldTask = new LambdaInvoke(this, 'HelloWorldTask', {
      lambdaFunction: helloWorldLambda,
      outputPath: '$.Payload',
    });

    // Define a Pass state (no-op) as an example
    const passState = new Pass(this, 'PassState');

    const waitState = new Wait(this, 'WaitState', {
      time: WaitTime.duration(Duration.seconds(5)),
    });

    // Define a Succeed state
    const succeedState = new Succeed(this, 'SucceedState');

    // Define a Fail state
    const failState = new Fail(this, 'FailState', {
      error: 'Error',
      cause: 'Something went wrong',
    });

    // Define a Choice state
    const choiceState = new Choice(this, 'ChoiceState');
    choiceState.when(Condition.booleanEquals('$.success', true), succeedState);
    choiceState.when(Condition.booleanEquals('$.success', false), failState);

    // Define the state machine
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definitionBody: DefinitionBody.fromChainable(helloWorldTask.next(passState).next(waitState).next(choiceState))
      // definition: helloWorldTask.next(passState).next(choiceState),
    });
  }
}
