import { Conduit, IConduitCallback } from "@archetypical/conduit"

interface SomePayload {
    msg: string;
}

async function PlainSuccessTest() {
    const cb: IConduitCallback<string> = x => console.log(x);
    console.log("Test: PlainSuccess");
    const conduit = new Conduit();
    const id = await conduit.subscribe("PlainSuccess", cb);
    await fetch('/Home/TestConduitPlain?eventKey=PlainSuccess&message=PlainSuccess responded');
    conduit.close();
    console.log('Test Completed: PlainSuccess');
}

async function FilterSuccessTest() {
    const cb: IConduitCallback<SomePayload> = x => console.log(x.msg);
    console.log("Test: FilterSuccess");
    const conduit = new Conduit();
    const id = await conduit.subscribe("FilterSuccess", cb);
    await conduit.applyFilter('SomeSubscriptionObject', { Sample: 'SampleValue' });
    await fetch('/Home/TestFilter?eventKey=FilterSuccess&match=SampleValue&message=FilterSuccess responded');
    conduit.close();
    console.log('Test Completed: FilterSuccess');
}

async function FilterMissTest() {
    const cb: IConduitCallback<SomePayload> = x => { throw Error(x.msg) };
    console.log("Test: FilterMiss");
    const conduit = new Conduit();
    const id = await conduit.subscribe("FilterMiss", cb);    
    await conduit.applyFilter('SomeSubscriptionObject', { Sample: 'SampleValue' });
    await fetch('/Home/TestFilter?eventKey=FilterMiss&match=DifferentValue&message=You should not see me!');
    conduit.close();
    console.log('Test Completed: FilterMiss');
}

(async () => {
    await PlainSuccessTest();
    await FilterSuccessTest();
    await FilterMissTest();
})();
