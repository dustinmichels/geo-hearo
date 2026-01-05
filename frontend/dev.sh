#!/usr/bin/env zsh

# Start ngrok in the background
echo "Starting ngrok on port 5173..."
ngrok http 5173 > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start up
echo "Waiting for ngrok to initialize..."
sleep 3

# Get the ngrok URL from the API
echo "Fetching ngrok URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.app' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "Error: Could not retrieve ngrok URL"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "\nNgrok URL: $NGROK_URL"
echo "\nQR Code:\n"

# Generate and display QR code
qrencode -t ansiutf8 "$NGROK_URL"

echo "\nNgrok is running (PID: $NGROK_PID)"
echo "Press Ctrl+C to stop..."

# Keep the script running and handle cleanup
trap "kill $NGROK_PID 2>/dev/null; echo '\nNgrok stopped.'; exit" INT TERM

# Wait for the ngrok process
wait $NGROK_PID