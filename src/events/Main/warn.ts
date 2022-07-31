import { Event } from '../../structures/Event';

export default new Event('warn', () => {
    console.log('Client Warning')
});