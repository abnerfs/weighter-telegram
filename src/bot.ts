import moment from "moment";
import TelegramBot from "node-telegram-bot-api";
import { weightDatabase } from "./db";
import { Weight } from "./models";
import { msToDate } from "./util";

const token = process.env.TELEGRAM_TOKEN;
if (!token)
    throw new Error("Invalid TELEGRAM_TOKEN");

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/peso ([\d.,]+)/g, async (msg, match) => {
    if (match) {
        const weight = parseFloat(match[1]);
        const today = moment(moment().format('YYYY-MM-DD')).valueOf();
        if (!isNaN(weight)) {
            const chatId = msg.chat.id;
            const userId = msg.from!.id.toString();

            const latestPromise = weightDatabase.latestWeight(userId, today);

            await weightDatabase.upsertWeight({
                userId,
                weight,
                date: today,
                createdAt: new Date()
            });

            const latest = (await latestPromise) as Weight | null;
            if (latest) {
                let observation;
                const prevDate = msToDate(latest.date);
                const diff = parseFloat((weight - latest.weight).toFixed(2));
                if (diff == 0) {
                    observation = `você manteve o mesmo peso de ${prevDate}`;
                }
                else if (diff > 0) {
                    observation = `😔 você ganhou ➕${diff}kg desde o dia ${prevDate}`;
                }
                else {
                    observation = `🎉 você perdeu ➖${Math.abs(diff)}kg desde o dia ${prevDate}`;
                }
                bot.sendMessage(chatId, `✔️ Peso de ${weight}kg salvo, ${observation}`);
            }
            else {
                bot.sendMessage(chatId, `✔️ Peso de ${weight}kg salvo.`);
            }
        }
    }
});

bot.onText(/\/historico/g, async (msg, _match) => {
    const chatId = msg.chat.id;
    const userId = msg.from!.id.toString();
    const weights = await weightDatabase.listWeights(userId);
    const response = weights
        .reverse()
        .reduce((prev: Array<Weight & { diff?: string }>, cur: Weight & { diff?: string }) => {
            const last = prev.length && prev[prev.length - 1];
            if (last) {
                const diff = cur.weight - last.weight;
                if (diff >= 0) {
                    cur.diff = ` (+${diff.toFixed(2)}kg)`;
                }
                else {
                    cur.diff = ` (${diff.toFixed(2)}kg)`;
                }
            }
            else
                cur.diff = ''
            return [...prev, cur];
        }, [])
        .reverse()
        .map(weight => `${msToDate(weight.date)} - ${weight.weight}kg${weight.diff}`)
        .join('\n');

    if (!response.length)
        bot.sendMessage(chatId, 'Você ainda não tem nenhum peso cadastrado');
    else
        bot.sendMessage(chatId, response);
});

