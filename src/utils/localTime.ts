export default function getLocalTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth()+1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${date}T${hours}:${minutes}:${seconds}.${milliseconds}Z`
};