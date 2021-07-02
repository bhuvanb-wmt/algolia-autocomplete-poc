import "bootstrap/dist/css/bootstrap.min.css";
import queryString from "query-string";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { algoliaSDK } from "../lib/Algolia";

export default class PLP extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const q = queryString.parse(window.location.search);
    try {
      const res = await algoliaSDK.getPLP(window.location.search);
      this.setState({
        data: res.data,
      });
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  }
  render() {
    return (
      <div className="p-4">
        <Container>
          <Row>
            <Col xs={12} sm={6} lg={3}>
              <div className="img-container">
                <img
                  src="https://en-ae-stage.6tst.com/media/catalog/product/cache/e051e343fbed6099e8c148bd11733e32/d/s/dsw-428998-bright-multi-760x850.jpg"
                  alt=""
                  loading="lazy"
                />
              </div>
              <h2 className="product-item-brand">Italian Shoemakers</h2>
              <p className="product-item-title">
                Softy X-Band Wedge Sandals - Bronze DSW-428998
              </p>
              <p className="price">
                <span className="base-price">AED 320</span>
                <span className="discount">9%</span>
                <span className="special-discount">AED 290</span>
              </p>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              All well
            </Col>
            <Col xs={12} sm={6} lg={3}>
              All well
            </Col>
            <Col xs={12} sm={6} lg={3}>
              All well
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}
