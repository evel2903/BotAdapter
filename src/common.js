function formatVNDateTime(isoDate) {
    const dateObj = new Date(isoDate);

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
