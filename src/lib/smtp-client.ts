import net from 'net'
import tls from 'tls'

type SmtpSendInput = {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
  toEmail: string
  subject: string
  text: string
}

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function escapeData(value: string) {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

function createReader(socket: net.Socket | tls.TLSSocket) {
  let buffer = ''

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
  })

  return async function readResponse() {
    const startedAt = Date.now()
    while (Date.now() - startedAt < 15000) {
      const lines = buffer.split(/\r?\n/)
      const completeIndex = lines.findIndex((line) => /^\d{3} /.test(line))
      if (completeIndex >= 0) {
        const response = lines.slice(0, completeIndex + 1).join('\n')
        buffer = lines.slice(completeIndex + 1).join('\n')
        const code = Number(response.slice(0, 3))
        return { code, response }
      }
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    throw new Error('SMTP server did not respond in time')
  }
}

async function writeCommand(socket: net.Socket | tls.TLSSocket, readResponse: () => Promise<{ code: number; response: string }>, command: string, expected: number[]) {
  socket.write(`${command}\r\n`)
  const response = await readResponse()
  if (!expected.includes(response.code)) {
    throw new Error(`SMTP command failed: ${response.response}`)
  }
  return response
}

function connectSocket(host: string, port: number, secure: boolean) {
  return new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port })
    socket.once('connect', () => resolve(socket))
    socket.once('secureConnect', () => resolve(socket))
    socket.once('error', reject)
  })
}

function upgradeToTls(socket: net.Socket, host: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host })
    secureSocket.once('secureConnect', () => resolve(secureSocket))
    secureSocket.once('error', reject)
  })
}

export async function sendSmtpMail(input: SmtpSendInput) {
  let socket = await connectSocket(input.host, input.port, input.secure)
  let readResponse = createReader(socket)
  const greeting = await readResponse()
  if (greeting.code !== 220) throw new Error(`SMTP greeting failed: ${greeting.response}`)

  await writeCommand(socket, readResponse, 'EHLO bookingcodex.chattoweb.com', [250])

  if (!input.secure) {
    await writeCommand(socket, readResponse, 'STARTTLS', [220])
    socket = await upgradeToTls(socket as net.Socket, input.host)
    readResponse = createReader(socket)
    await writeCommand(socket, readResponse, 'EHLO bookingcodex.chattoweb.com', [250])
  }

  await writeCommand(socket, readResponse, 'AUTH LOGIN', [334])
  await writeCommand(socket, readResponse, Buffer.from(input.username).toString('base64'), [334])
  await writeCommand(socket, readResponse, Buffer.from(input.password).toString('base64'), [235])
  await writeCommand(socket, readResponse, `MAIL FROM:<${input.fromEmail}>`, [250])
  await writeCommand(socket, readResponse, `RCPT TO:<${input.toEmail}>`, [250, 251])
  await writeCommand(socket, readResponse, 'DATA', [354])

  const from = input.fromName ? `${encodeHeader(input.fromName)} <${input.fromEmail}>` : input.fromEmail
  const message = [
    `From: ${from}`,
    `To: ${input.toEmail}`,
    `Subject: ${encodeHeader(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    escapeData(input.text),
  ].join('\r\n')

  await writeCommand(socket, readResponse, `${message}\r\n.`, [250])
  await writeCommand(socket, readResponse, 'QUIT', [221])
  socket.end()
}
