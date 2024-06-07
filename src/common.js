import { format, toZonedTime } from 'date-fns-tz';

function formatVNDateTime(isoDate) {
    const timeZone = 'Asia/Ho_Chi_Minh'; // Múi giờ Việt Nam
    const dateObj = toZonedTime(new Date(isoDate), timeZone);

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');

    const formattedDate = `Ngày ${day}/${month}/${year} Lúc ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}

export { formatVNDateTime }
