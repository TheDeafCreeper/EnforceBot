import { db } from '../run';
import {v4 as uuid} from 'uuid';
import { ScheduledEventOptions, ScheduledEventData } from '../typings/ScheduledEvents';

export class ScheduledEvent {
    constructor(options: ScheduledEventOptions) {
        const data = {
            id: uuid(),
            ...options
        } as ScheduledEventData;
        db.insert('ScheduledEvents', data);
    }
}