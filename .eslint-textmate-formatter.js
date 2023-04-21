module.exports = function (results) {
  let allMessages = [];

  // Collect messages from all files
  results.forEach((result) => {
    const { filePath, messages } = result;

    messages.forEach((message) => {
      const { line, column, severity, ruleId, message: errorMessage } = message;
      allMessages.push({
        filePath,
        line,
        column,
        severity,
        ruleId,
        errorMessage,
      });
    });
  });

  // Sort messages by ruleId + errorMessage
  allMessages.sort((a, b) => {
    if (`${a.ruleId} ${a.errorMessage}` < `${b.ruleId} ${b.errorMessage}`) {
      return -1;
    }
    if (`${a.ruleId} ${a.errorMessage}` > `${b.ruleId} ${b.errorMessage}`) {
      return 1;
    }
    return 0;
  });

  // Generate output
  let output = '';
  allMessages.forEach((message) => {
    const { filePath, line, column, severity, ruleId, errorMessage } = message;
    const messageType = severity === 1 ? 'Warning' : 'Error';

    const textMateLink = `txmt://open?url=file://${encodeURIComponent(filePath)}&line=${line}&column=${column}`;

    output += `${messageType}: ${errorMessage} (${ruleId})\n`;
    output += `File: ${filePath.split('/').pop()}:${line}:${column}\n`;
    output += `Link: ${textMateLink}\n\n`;
  });

  return output;
};
