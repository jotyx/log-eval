// Evaluators - in order of reference values in log line
const evaluators = {
    thermometer: ({readings, reference: {thermometer}}) => {
        const sum = readings.reduce((a, b) => a + b);
        const n = readings.length;
        const mean = sum / n ?? 0;
        const standardDeviation = Math.sqrt(
            readings
                .map((reading) => Math.pow(reading - mean, 2))
                .reduce((a, b) => a + b) / n
        );

        if (Math.abs(mean - thermometer) <= 0.5 && standardDeviation < 3) {
            return "ultra precise";
        } else if (Math.abs(mean - thermometer) <= 0.5 && standardDeviation < 5) {
            return "very precise";
        } else {
            return "precise";
        }
    },
    humidity: ({readings, reference: {humidity}}) => {
        return readings
            .map((reading) => Math.abs(reading - humidity) <= 1)
            .every((x) => x) ? "keep" : "discard";
    },
    monoxide: ({readings, reference: {monoxide}}) => {
        return readings
            .map((reading) => Math.abs(reading - monoxide) <= 3)
            .every((x) => x) ? "keep" : "discard";
    }
}

// Meanings of values on set positions (indices) in log line
// for device and reading lines
const LOG_LINE_MEANING = {
    reading: {
        time: 0,
        value: 1,
    },
    device: {
        type: 0,
        id: 1,
    }
};

const evaluateLogFile = (logContentsStr) => {
    const logLines = logContentsStr.split("\n");

    let currentReference = {};
    let devices = [];
    logLines.forEach((line) => {
        const currentLineWords = line.split(" ");
        if (currentLineWords.length < 2) return;

        const firstWordOfLine = currentLineWords[0];

        if (firstWordOfLine === "reference" && currentLineWords.length === 4) {
            // reference line
            Object.keys(evaluators).forEach((name, index) =>
                currentReference[name] = Number(currentLineWords[index + 1]));
        } else if (currentLineWords.length === 2 && !/^\d/.test(firstWordOfLine)) {
            // new device line
            devices.push({
                type: currentLineWords[LOG_LINE_MEANING.device.type],
                id: currentLineWords[LOG_LINE_MEANING.device.id],
                readings: [],
                reference: {...currentReference}
            });
        } else {
            // reading line
            if (devices.length > 0) {
                devices[devices.length - 1].readings.push(Number(currentLineWords[LOG_LINE_MEANING.reading.value]));
            }
        }
    });

    return Object.fromEntries(
        devices.map((device) => [
            device.id,
            evaluators[device.type] ? evaluators[device.type](device) : "unknown",
        ])
    );
};

module.exports = evaluateLogFile;
