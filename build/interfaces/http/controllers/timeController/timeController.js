"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeLeft = exports.getCurrentTime = void 0;
// Controlador para obtener la hora actual con zona horaria opcional
const getCurrentTime = (req, res) => {
    const { timezone, currentDate } = req.query;
    try {
        let date;
        if (currentDate) {
            const parsedDate = new Date(currentDate);
            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({ error: 'Invalid currentDate format' });
                return;
            }
            date = parsedDate;
        }
        else {
            date = new Date();
        }
        const options = {
            timeZone: timezone ? timezone : 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
        const isoDate = new Date(formattedDate);
        const [month, day, year, hour, minute, second] = formattedDate
            .replace(',', '')
            .split(/[/\s:]/);
        const localDateTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
        res.json({
            dateTime: localDateTime,
        });
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid timezone or currentDate provided' });
    }
};
exports.getCurrentTime = getCurrentTime;
const getTimeLeft = (req, res) => {
    const { endTime, timezone } = req.body;
    if (!endTime) {
        res.status(400).json({ error: 'endTime is required' });
        return;
    }
    try {
        const timeZoneToUse = timezone ? timezone : 'America/Bogota';
        // const now = new Date(new Date().toLocaleString('en-US', { timeZone: timeZoneToUse }));
        const now = new Date();
        const end = new Date(new Date(endTime).toLocaleString('en-US', { timeZone: timeZoneToUse }));
        if (isNaN(end.getTime())) {
            res.status(400).json({ error: 'Invalid endTime format' });
            return;
        }
        const difference = end.getTime() - now.getTime();
        if (difference <= 0) {
            res.json({
                timeLeft: '00:00:00',
            });
            return;
        }
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const formattedTimeLeft = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log([now.toString()]);
        res.json({
            timeLeft: formattedTimeLeft,
            currentTime: now.toISOString(),
            now: now.toString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while calculating time left' });
    }
};
exports.getTimeLeft = getTimeLeft;
