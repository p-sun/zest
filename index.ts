const appRoot = document.getElementById('app');
if (appRoot) {
    const newContent = document.createTextNode("Hi there and greetings!");
    appRoot.appendChild(newContent);
}
