import React, { useContext, useState } from 'react'
import { Container, Col, Row, Dropdown, Form } from 'react-bootstrap'

import { defaultNetworks } from 'src/services/networkProvider'
import { UserPrefContext } from 'src/services/userPrefProvider'

import Dropzone from './Dropzone/Dropzone'
import ImportExport from './ImportExport/ImportExport'
import LabelCard from './LabelCard/LabelCard'

import './LabelsPage.css'

const LabelsPage: React.FC = () => {

  const userPrefContext = useContext(UserPrefContext)
  const { labelMap, nodeUrlMap, setLabelMap } = userPrefContext!

  const [searchFilter, setSearchFilter] = useState('')
  const [typefilter, setTypefilter] = useState('All')
  const [networkFilter, setNetworkFilter] = useState('All')

  return (
    <>
      <Container>
        <Row className='m-0'>
          <h4>
            Labels
          </h4>
        </Row>
        <Row className='m-0 pb-3'>
          <span className='subtext'>Label data is stored in your browser&apos;s local storage. To browse labels in different networks, switch to that network using network selector.</span>
        </Row>
        <Row className='justify-content-between flex-nowrap m-0'>
          <div className='filter-div'>
            <span>
              Network:
            </span>
            <Dropdown className="ml-3">
              <Dropdown.Toggle id="label-network-toggle">{defaultNetworks[networkFilter] || networkFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setNetworkFilter('All')}>All</Dropdown.Item>
                {Object.entries({ ...defaultNetworks, ...nodeUrlMap }).map(([k, v], index) =>
                  <Dropdown.Item onClick={() => setNetworkFilter(k)} key={index}>{v}</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
            <span className='ml-3'>
              Label Type:
            </span>
            <Dropdown className="ml-3">
              <Dropdown.Toggle id="label-type-toggle">{typefilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setTypefilter('All')}>All</Dropdown.Item>
                <Dropdown.Item onClick={() => setTypefilter('Account')}>Accounts</Dropdown.Item>
                <Dropdown.Item onClick={() => setTypefilter('Contract')}>Contracts</Dropdown.Item>
                <Dropdown.Item onClick={() => setTypefilter('Transaction')}>Transactions</Dropdown.Item>
                <Dropdown.Item onClick={() => setTypefilter('Tx Block')}>Tx Blocks</Dropdown.Item>
                <Dropdown.Item onClick={() => setTypefilter('DS Block')}>DS Blocks</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Form.Control
              className='search-filter-form'
              type="text"
              value={searchFilter}
              autoFocus
              placeholder='Search for label'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchFilter(e.target.value) }} />
          </div>
          <ImportExport labelMap={labelMap} setLabelCb={setLabelMap} />
        </Row>
        <Row className='mt-3'>
          {Object.entries(labelMap).length === 0
            ? <Dropzone setLabelCb={setLabelMap} />
            : Object.entries(labelMap)
              .filter(([, v]) => (typefilter === 'All' || v.type === typefilter))
              .filter(([, v]) => (networkFilter === 'All' || v.network === networkFilter))
              .filter(([, v]) => (v.name.includes(searchFilter)))
              .map(([k, v]) => (
                <Col className='my-3' key={k} md={6} lg={4} >
                  <LabelCard k={k} v={v} />
                </Col>
              ))}
        </Row>
      </Container>
    </>
  )
}

export default LabelsPage
