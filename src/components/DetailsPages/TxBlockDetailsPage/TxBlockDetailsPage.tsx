import React, { useMemo, useCallback, useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { OverlayTrigger, Tooltip, Card, Row, Col, Container, Spinner } from 'react-bootstrap'

import { QueryPreservingLink } from 'src'
import ViewAllTable from 'src/components/ViewAllPages/ViewAllTable/ViewAllTable'
import { NetworkContext } from 'src/services/networkProvider'
import { TransactionDetails } from 'src/typings/api'
import { qaToZil, timestampToTimeago, hexAddrToZilAddr, timestampToDisplay, pubKeyToZilAddr } from 'src/utils/Utils'
import { TxBlockObj } from '@zilliqa-js/core/src/types'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCaretSquareLeft, faCaretSquareRight } from '@fortawesome/free-regular-svg-icons'
import { faFileContract, faCubes } from '@fortawesome/free-solid-svg-icons'

import LabelStar from '../LabelStar/LabelStar'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import './TxBlockDetailsPage.css'

// Pre-processing data to display
const processMap = new Map()
processMap.set('amount-col', (amt: number) => (
  <OverlayTrigger placement='top'
    overlay={<Tooltip id={'tt'}> {qaToZil(amt)} </Tooltip>}>
    <span>{qaToZil(amt)}</span>
  </OverlayTrigger>
))
processMap.set('from-col', (addr: string) => (<QueryPreservingLink to={`/address/${hexAddrToZilAddr(addr)}`}>{hexAddrToZilAddr(addr)}</QueryPreservingLink>))
processMap.set('to-col', (addr: string) => (
  addr.includes('contract-')
    ? <QueryPreservingLink to={`/address/${hexAddrToZilAddr(addr.substring(9))}`}>
      <FontAwesomeIcon color='darkturquoise' icon={faFileContract} />
      {' '}
      Contract Creation
    </QueryPreservingLink>
    : <QueryPreservingLink to={`/address/${hexAddrToZilAddr(addr)}`}>{hexAddrToZilAddr(addr)}</QueryPreservingLink>))

processMap.set('hash-col', (hash: number) => (<QueryPreservingLink to={`/tx/0x${hash}`}>{'0x' + hash}</QueryPreservingLink>))

const TxBlockDetailsPage: React.FC = () => {

  const { blockNum } = useParams()
  const networkContext = useContext(NetworkContext)
  const { dataService, isIsolatedServer } = networkContext!

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTrans, setIsLoadingTrans] = useState(false)
  const [txBlockObj, setTxBlockObj] = useState<TxBlockObj | null>(null)
  const [txBlockTxns, setTxBlockTxns] = useState<string[] | null>(null)
  const [latestTxBlockNum, setLatestTxBlockNum] = useState<number | null>(null)
  const [transactionData, setTransactionData] = useState<TransactionDetails[] | null>(null)

  // Fetch data
  useEffect(() => {
    setIsLoading(true)
    if (!dataService || isIsolatedServer === null) return

    let latestTxBlockNum: number
    let txBlockObj: TxBlockObj
    let txBlockTxns: string[]
    const getData = async () => {
      if (isNaN(blockNum))
        throw new Error('Not a valid block number')
      try {
        if (isIsolatedServer) {
          txBlockTxns = await dataService.getISTransactionsForTxBlock(parseInt(blockNum))
        } else {
          txBlockObj = await dataService.getTxBlockObj(parseInt(blockNum))
          latestTxBlockNum = await dataService.getNumTxBlocks()
          try {
            txBlockTxns = await dataService.getTransactionsForTxBlock(parseInt(blockNum))
          } catch (e) { console.log(e) }
        }
        if (txBlockObj)
          setTxBlockObj(txBlockObj)
        if (txBlockTxns)
          setTxBlockTxns(txBlockTxns)
        if (latestTxBlockNum)
          setLatestTxBlockNum(latestTxBlockNum)
      } catch (e) {
        console.log(e)
        setError(e)
      } finally {
        setIsLoading(false)
      }
    }

    getData()
    return () => {
      setTxBlockObj(null)
      setTxBlockTxns(null)
      setLatestTxBlockNum(null)
      setError(null)
    }
  }, [blockNum, dataService, isIsolatedServer])

  const columns = useMemo(
    () => [{
      id: 'from-col',
      Header: 'From',
      accessor: 'txn.senderAddress',
    },
    {
      id: 'to-col',
      Header: 'To',
      accessor: (txnData: any) => (
        txnData.contractAddr
          ? 'contract-' + txnData.contractAddr
          : txnData.txn.txParams.toAddr),
    },
    {
      id: 'amount-col',
      Header: 'Amount',
      accessor: 'amount',
    },
    {
      id: 'hash-col',
      Header: 'Hash',
      accessor: 'hash',
    }], []
  )

  const fetchData = useCallback(({ pageIndex }) => {
    if (!txBlockTxns || !dataService) return

    let receivedData: TransactionDetails[]
    const getData = async () => {
      try {
        setIsLoadingTrans(true)
        receivedData = await dataService.getTransactionsDetails(txBlockTxns.slice(pageIndex * 10, pageIndex * 10 + 10))

        if (receivedData)
          setTransactionData(receivedData)
      } catch (e) {
        console.log(e)
      } finally {
        setIsLoadingTrans(false)
      }
    }

    getData()
  }, [dataService, txBlockTxns])

  return <>
    {isLoading ? <div className='center-spinner'><Spinner animation="border" variant="secondary" /></div> : null}
    {error
      ? <NotFoundPage />
      : <>
        {!isLoading && isIsolatedServer && (
          <>
            <div style={{ marginBottom: '1rem' }} className='txblock-header'>
              <h3>
                <span>
                  <FontAwesomeIcon color='grey' icon={faCubes} />
                </span>
                <span style={{ marginLeft: '0.75rem' }}>
                  Tx Block
              </span>
                {' '}
                <span className='txblock-header-blocknum'>#{blockNum}</span>
                <LabelStar />
              </h3>
            </div>
          </>
        )}
        {txBlockObj && (
          <>
            <div className='txblock-header'>
              <h3>
                <span>
                  <FontAwesomeIcon color='grey' icon={faCubes} />
                </span>
                <span style={{ marginLeft: '0.75rem' }}>
                  Tx Block
              </span>
                {' '}
                <span className='txblock-header-blocknum'>#{blockNum}</span>
                <LabelStar />
              </h3>
              <span>
                <QueryPreservingLink
                  style={{ marginRight: '1rem' }}
                  className={parseInt(txBlockObj.header.BlockNum) === 0 ? 'disabled-link' : ''}
                  to={`/txbk/${parseInt(txBlockObj.header.BlockNum) - 1}`}>
                  <FontAwesomeIcon size='2x' icon={faCaretSquareLeft} />
                </QueryPreservingLink>
                <QueryPreservingLink
                  className={latestTxBlockNum && parseInt(txBlockObj.header.BlockNum) === latestTxBlockNum - 1 ? 'disabled-link' : ''}
                  to={`/txbk/${parseInt(txBlockObj.header.BlockNum) + 1}`}>
                  <FontAwesomeIcon size='2x' icon={faCaretSquareRight} />
                </QueryPreservingLink>
              </span>
            </div>
            <div style={{ display: 'flex' }}>
              <h6 className='txblock-hash'>{'0x' + txBlockObj.body.BlockHash}</h6>
              <div onClick={() => {
                navigator.clipboard.writeText(txBlockObj.body.BlockHash)
              }} className='txblock-hash-copy-btn'>
                <FontAwesomeIcon icon={faCopy} />
              </div>
            </div>
            <Card className='txblock-details-card'>
              <Card.Body>
                <Container>
                  <Row>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Date:</span>
                        <span>
                          {timestampToDisplay(txBlockObj.header.Timestamp)}
                          {' '}
                        ({timestampToTimeago(txBlockObj.header.Timestamp)})
                      </span>
                      </div>
                    </Col>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Transactions:</span>
                        <span>{txBlockObj.header.NumTxns}</span>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Gas Limit:</span>
                        <span>{txBlockObj.header.GasLimit}</span>
                      </div>
                    </Col>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Gas Used:</span>
                        <span>{txBlockObj.header.GasUsed}</span>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Rewards:</span>
                        <span>{qaToZil(txBlockObj.header.Rewards)}</span>
                      </div>
                    </Col>
                    <Col>
                      <div className='txblock-detail'>
                        <span>DS Block:</span>
                        <span><QueryPreservingLink to={`/dsbk/${txBlockObj.header.DSBlockNum}`}>{txBlockObj.header.DSBlockNum}</QueryPreservingLink></span>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className='txblock-detail'>
                        <span>Miner:</span>
                        <span><QueryPreservingLink to={`/address/${pubKeyToZilAddr(txBlockObj.header.MinerPubKey)}`}>{pubKeyToZilAddr(txBlockObj.header.MinerPubKey)}</QueryPreservingLink></span>
                      </div>
                    </Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>
            {txBlockObj.body.MicroBlockInfos.length > 0 && (
              <Card className='txblock-details-card'>
                <Card.Body>
                  <Container>
                    <h6>Micro Blocks</h6>
                    {txBlockObj.body.MicroBlockInfos.map((x) => <div key={x.MicroBlockHash}>[{x.MicroBlockShardId}] {x.MicroBlockHash}</div>)}
                  </Container>
                </Card.Body>
              </Card>
            )}
          </>
        )}
        {txBlockTxns && txBlockTxns.length > 0 && (
          <>
            <h4>Transactions</h4>
            <ViewAllTable
              isLoading={isLoadingTrans}
              fetchData={fetchData}
              pageCount={Math.ceil(txBlockTxns.length / 10)}
              columns={columns}
              data={transactionData ? transactionData : []}
              processMap={processMap} />
          </>
        )}
      </>
    }
  </>
}

export default TxBlockDetailsPage
