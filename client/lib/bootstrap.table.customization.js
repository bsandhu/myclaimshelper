function cellStyleFn(value, row, index) {

    // Apply darkening logic to the 'Age' column
    if (String(value).endsWith('days')) {
        var days = Number(value.split('days')[0]);
        days = days <= 0 ? 1 : days;

        return {
            css: {'color': 'darkblue', 'font-weight': days * 100}
        }
    }
    return {classes: ''}
}
