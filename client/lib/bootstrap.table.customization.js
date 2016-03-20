function cellStyleFn(value, row, index) {

    // Apply darkening logic to the 'Age' column
    if (String(value).endsWith('days')) {
        return {
            css: {'color': 'darkblue', 'font-weight': Number(row.age) * 20}
        }
    }
    return {classes: ''}
}
