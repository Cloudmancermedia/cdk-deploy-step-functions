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
    const randomNumberLambda = new NodejsFunction(this, 'RandomNumberLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lib/lambda/random.ts',
      handler: 'handler',
    });

    // Define a task that invokes the Lambda function
    const randomNumberTask = new LambdaInvoke(
      this,
      'RandomNumberTask',
      {
        lambdaFunction: randomNumberLambda,
        outputPath: '$.Payload',
      }
    );

    // Define a Pass state (no-op) as an example
    const addTimestampState = new Pass(this, 'AddTimestampState', {
      parameters: {
        'value.$': '$.value',
        'timestamp.$': '$$.State.EnteredTime'
      },
      resultPath: '$'
    });

    const waitState = new Wait(this, 'WaitState', {
      time: WaitTime.duration(Duration.seconds(5)),
    });

    // Define a Succeed state
    const succeedState = new Succeed(this, 'SucceedState');

    // Define a Fail state
    const failState = new Fail(this, 'FailState', {
      error: 'Error',
      cause: 'Value is less than .3',
    });

    // Define a Choice state
    const choiceState = new Choice(this, 'ChoiceState');
    choiceState.when(Condition.numberLessThan('$.value', 0.33), failState);
    choiceState.when(
      Condition.and(
        Condition.numberGreaterThanEquals('$.value', 0.33),
        Condition.numberLessThanEquals('$.value', 0.66)
      ),
      randomNumberTask
    );
    choiceState.when(Condition.numberGreaterThan('$.value', 0.66), succeedState);

    // Define the state machine
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definitionBody: DefinitionBody.fromChainable(
        randomNumberTask
        .next(addTimestampState)
        .next(waitState)
        .next(choiceState)
      )
    });
  }
}
