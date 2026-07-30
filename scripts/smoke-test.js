const { PrismaClient } = require('@prisma/client')

async function main() {
  const p = new PrismaClient()
  const user = await p.user.findFirst({ where: { email: 'test@analytivo.local' } })
  if (!user) throw new Error('user missing')

  const existing = await p.link.findUnique({ where: { alias: 'demo123' } })
  if (!existing) {
    await p.link.create({
      data: {
        title: 'Demo Video',
        alias: 'demo123',
        originalUrl: 'https://example.com',
        userId: user.id,
        source: 'whatsapp',
      },
    })
    console.log('created link demo123')
  } else {
    console.log('link exists')
  }

  const res = await fetch('http://localhost:3000/l/demo123', { redirect: 'manual' })
  console.log('redirect status', res.status, 'location', res.headers.get('location'))

  const clicks = await p.click.count({ where: { link: { alias: 'demo123' } } })
  console.log('clicks', clicks)
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
