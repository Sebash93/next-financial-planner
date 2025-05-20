export const numberToCurrency = (number: number) => {
    console.log("numberToCurrency", number);
    return number.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });
}

export const currencyToNumber = (currency: string) => {
    return Number(currency.replace(/[^0-9]/g, ""));
}
