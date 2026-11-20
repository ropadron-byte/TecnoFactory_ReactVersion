import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import PageHead from '../components/PageHead.jsx'
import { listarBlogs } from '../services/blogsApi'
import { formatearFecha } from '../utils/formato'
import usePageTitle from '../hooks/usePageTitle'

export default function Blogs() {
  usePageTitle('Blogs')
  const [blogs, setBlogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    listarBlogs()
      .then((datos) => activo && setBlogs(datos))
      .catch((fallo) => activo && setError(fallo.message ?? 'No se pudieron cargar los blogs.'))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <PageHead eyebrow="TF / BLOG" titulo="Novedades y curiosidades tecno">
        Aquí podrás encontrar noticias de la tienda, lanzamientos y datos curiosos sobre tecnología, publicados
        por el equipo de Tecno Factory.
      </PageHead>

      <Container className="py-4">
        {cargando && (
          <div className="d-flex align-items-center gap-2" role="status">
            <Spinner animation="border" size="sm" /> Cargando publicaciones...
          </div>
        )}

        {error && (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        )}

        {!cargando && !error && blogs.length === 0 && (
          <Alert variant="info">Todavía no hay publicaciones. Vuelve pronto.</Alert>
        )}

        <Row xs={1} md={2} lg={3} className="g-4">
          {blogs.map((blog) => (
            <Col key={blog.id}>
              <Card as="article" className="h-100 shadow-sm">
                <div className="position-relative">
                  {blog.imagenPrincipal?.url ? (
                    <Card.Img
                      variant="top"
                      src={blog.imagenPrincipal.url}
                      alt={blog.titulo}
                      style={{ height: 180, objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center text-body-secondary" style={{ height: 180 }}>
                      Sin portada
                    </div>
                  )}
                  <Badge bg="warning" text="dark" className="position-absolute top-0 start-0 m-2">
                    BLOG
                  </Badge>
                </div>
                <Card.Body className="d-flex flex-column">
                  <small className="text-body-secondary">{formatearFecha(blog.fechaCreacion)}</small>
                  <Card.Title as="h3" className="h5">
                    {blog.titulo}
                  </Card.Title>
                  <Link className="btn btn-outline-primary btn-sm mt-auto align-self-start" to={`/blogs/${blog.id}`}>
                    Leer más
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  )
}
