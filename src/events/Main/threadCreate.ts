import { Event } from '../../structures/Event';
import { Thread } from '../../structures/Thread';
import { Channel } from '../../structures/Channel';
import { Server } from '../../structures/Server';

export default new Event('threadCreate', async (threadChannel) => {
    let server = new Server(threadChannel.guild)
    let channel = new Channel(server, threadChannel.parent)
    let thread = new Thread(channel, threadChannel)

    threadChannel.join()
    if (channel.threads == undefined) channel.threads = []
    channel.threads.push(threadChannel.id)

    server.save()
    channel.save()
    thread.save()
});