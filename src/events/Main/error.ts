import { Event } from '../../structures/Event';

export default new Event('error', () => {
    console.log('Client Error')
});