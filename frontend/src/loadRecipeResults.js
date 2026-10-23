export function loadRecipeResults(url, queryKey, setResult) {
    let active = true;

    fetch(url)
        .then((response) => response.json())
        .then((recipes) => {
            if (active) {
                setResult({ key: queryKey, recipes });
            }
        })
        .catch((error) => {
            if (active) {
                console.error('Error fetching recipes:', error);
            }
        });

    // React runs this cleanup when the query changes or the component unmounts.
    return () => {
        active = false;
    };
}
