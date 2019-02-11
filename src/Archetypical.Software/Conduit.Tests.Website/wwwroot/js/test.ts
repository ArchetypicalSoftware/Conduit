import { Conduit, IConduitCallback } from '@archetypical/conduit'

(window as any).conduit = Conduit;

interface SomePayload {
    msg: string;
}

async function FilterSuccessTest() {    
    const cb1: IConduitCallback<SomePayload> = x => console.log(`cb1: ${x.msg}`);
    const cb2: IConduitCallback<SomePayload> = x => console.log(`cb2: ${x.msg}`);
    console.log('Test: FilterSuccess');
    const conduit = new Conduit();
    
    await conduit.applyFilter('SomeSubscriptionObject', { Sample: 'SampleValue' });

    await conduit.start();
    await conduit.on('SomePayload', cb2);
    await conduit.on('SomePayload', cb1);
    await conduit.on('SomePayload', cb2);
    await fetch('/Home/TestFilter?eventKey=FilterSuccess&match=SampleValue&message=FilterSuccess responded');
    await fetch('/Home/TestFilter?eventKey=FilterSuccess&match=OtherValue&message=FilterSuccess responded: DON\'T SEE ME!');
    await conduit.stop();
    console.log('Test Completed: FilterSuccess');
}

async function FilterMissTest() {
    const cb: IConduitCallback<SomePayload> = x => { throw Error(x.msg) };
    console.log('Test: FilterMiss');
    const conduit = new Conduit();
    await conduit.start();
    await conduit.on('SomePayload', cb);    
    await conduit.applyFilter('SomeSubscriptionObject', { Sample: 'SampleValue' });
    await fetch('/Home/TestFilter?eventKey=FilterMiss&match=DifferentValue&message=You should not see me!');
    await conduit.stop();
    console.log('Test Completed: FilterMiss');
}

(async () => {
    await FilterSuccessTest();
    await FilterMissTest();
})();
