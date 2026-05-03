console.log(`
Script disabilitato.

Motivo:
- la libreria npm "xlsx" è stata rimossa perché segnalata vulnerabile e senza fix disponibile tramite npm;
- il sito usa già il file statico src/data/italyLocations.json;
- per aggiornare province/comuni in futuro, rigenerare il JSON con uno script alternativo sicuro oppure convertire il file ISTAT fuori dal progetto.

File attualmente usato dal sito:
src/data/italyLocations.json
`)
