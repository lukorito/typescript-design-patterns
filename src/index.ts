interface BaseRecord {
  id: string;
}
interface BeforeSetEvent<T> {
  value: T;
  newValue: T;
}

interface AfterSetEvent<T> {
  value: T;
}

interface Database<T extends BaseRecord> {
  get(id: string): T | undefined;
  set(newValue: T): void;

  onBeforeAdd(listener: Listener<BeforeSetEvent<T>>): () => void;
  onAfterAdd(listener: Listener<AfterSetEvent<T>>): () => void;
}

// factory design pattern
function createDatabase<T extends BaseRecord>() {
  class InMemoryDatabase implements Database<T> {
    private db: Record<string, T> = {};

    private beforeAddListeners = createObserver<BeforeSetEvent<T>>();
    private afterAddListeners = createObserver<AfterSetEvent<T>>();

    public get(id: string): T | undefined {
      return this.db[id];
    }

    public set(newValue: T): void {
      this.beforeAddListeners.publish({
        newValue,
        value: this.db[newValue.id],
      });
      this.db[newValue.id] = newValue;
      this.afterAddListeners.publish({
        value: newValue,
      });
    }

    onBeforeAdd(listener: Listener<BeforeSetEvent<T>>): () => void {
      return this.beforeAddListeners.subscribe(listener);
    }
    onAfterAdd(listener: Listener<AfterSetEvent<T>>): () => void {
      return this.afterAddListeners.subscribe(listener);
    }
  }
  //   singleton pattern
  // const db = new InMemoryDatabase()
  // return db
  return InMemoryDatabase;
}

interface Car {
  id: string;
  YOM: number;
}

const CarDB = createDatabase<Car>();
const carDb = new CarDB();

carDb.set({
  id: "toyota",
  YOM: 2001,
});

console.log(carDb.get("toyota"));

// Observable Pattern
type Listener<EventType> = (ev: EventType) => void;
// Observer
function createObserver<EventType>(): {
  subscribe: (listener: Listener<EventType>) => () => void;
  publish: (event: EventType) => void;
} {
  let listeners: Listener<EventType>[] = [];
  return {
    subscribe: (listener: Listener<EventType>): (() => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    publish: (event: EventType) => {
      listeners.forEach((l) => l(event));
    },
  };
}
