const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
// const { BigNumber, utils } = require("ethers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("1") // 1 ETH
          beforeEach(async function () {
              // deploy our FundMe contract
              // using hardhat deploy
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  if (!transactionReceipt) {
                      console.error("Transaction receipt is undefined or null.")
                  } else {
                      const { gasUsed, effectiveGasPrice } = transactionReceipt

                      // Check if gasUsed and effectiveGasPrice are valid values
                      if (
                          gasUsed !== undefined &&
                          effectiveGasPrice !== undefined
                      ) {
                          // Convert gasUsed and effectiveGasPrice to BigInt
                          const gasUsedBN = BigInt(gasUsed.toString())
                          const effectiveGasPriceBN = BigInt(
                              effectiveGasPrice.toString()
                          )

                          // Calculate gasCost as a BigInt
                          const gasCost = gasUsedBN * effectiveGasPriceBN

                          // Retrieve and check if other balance values are defined
                          if (
                              startingFundMeBalance &&
                              startingDeployerBalance &&
                              endingFundMeBalance &&
                              endingDeployerBalance
                          ) {
                              // Convert balance values to BigInt
                              const startingFundMeBalanceBN = BigInt(
                                  startingFundMeBalance.toString()
                              )
                              const startingDeployerBalanceBN = BigInt(
                                  startingDeployerBalance.toString()
                              )
                              const endingFundMeBalanceBN = BigInt(
                                  endingFundMeBalance.toString()
                              )
                              const endingDeployerBalanceBN = BigInt(
                                  endingDeployerBalance.toString()
                              )

                              // Assert
                              assert.equal(endingFundMeBalanceBN, BigInt(0))
                              assert.equal(
                                  (
                                      startingFundMeBalanceBN +
                                      startingDeployerBalanceBN
                                  ).toString(),
                                  (endingDeployerBalanceBN + gasCost).toString()
                              )
                          } else {
                              console.error(
                                  "One or more balance values are undefined."
                              )
                          }
                      } else {
                          console.error("Gas values are undefined or null.")
                      }
                  }
              })

              // This is for cheaper withdrawal
              it("Withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  if (!transactionReceipt) {
                      console.error("Transaction receipt is undefined or null.")
                  } else {
                      const { gasUsed, effectiveGasPrice } = transactionReceipt

                      // Check if gasUsed and effectiveGasPrice are valid values
                      if (
                          gasUsed !== undefined &&
                          effectiveGasPrice !== undefined
                      ) {
                          // Convert gasUsed and effectiveGasPrice to BigInt
                          const gasUsedBN = BigInt(gasUsed.toString())
                          const effectiveGasPriceBN = BigInt(
                              effectiveGasPrice.toString()
                          )

                          // Calculate gasCost as a BigInt
                          const gasCost = gasUsedBN * effectiveGasPriceBN

                          // Retrieve and check if other balance values are defined
                          if (
                              startingFundMeBalance &&
                              startingDeployerBalance &&
                              endingFundMeBalance &&
                              endingDeployerBalance
                          ) {
                              // Convert balance values to BigInt
                              const startingFundMeBalanceBN = BigInt(
                                  startingFundMeBalance.toString()
                              )
                              const startingDeployerBalanceBN = BigInt(
                                  startingDeployerBalance.toString()
                              )
                              const endingFundMeBalanceBN = BigInt(
                                  endingFundMeBalance.toString()
                              )
                              const endingDeployerBalanceBN = BigInt(
                                  endingDeployerBalance.toString()
                              )

                              // Assert
                              assert.equal(endingFundMeBalanceBN, BigInt(0))
                              assert.equal(
                                  (
                                      startingFundMeBalanceBN +
                                      startingDeployerBalanceBN
                                  ).toString(),
                                  (endingDeployerBalanceBN + gasCost).toString()
                              )
                          } else {
                              console.error(
                                  "One or more balance values are undefined."
                              )
                          }
                      } else {
                          console.error("Gas values are undefined or null.")
                      }
                  }
              })

              it("allows us to withdraw with multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  if (!transactionReceipt) {
                      console.error("Transaction receipt is undefined or null.")
                  } else {
                      const { gasUsed, effectiveGasPrice } = transactionReceipt

                      // Check if gasUsed and effectiveGasPrice are valid values
                      if (
                          gasUsed !== undefined &&
                          effectiveGasPrice !== undefined
                      ) {
                          // Convert gasUsed and effectiveGasPrice to BigInt
                          const gasUsedBN = BigInt(gasUsed.toString())
                          const effectiveGasPriceBN = BigInt(
                              effectiveGasPrice.toString()
                          )

                          // Calculate gasCost as a BigInt
                          const gasCost = gasUsedBN * effectiveGasPriceBN

                          // Retrieve and check if other balance values are defined
                          if (
                              startingFundMeBalance &&
                              startingDeployerBalance &&
                              endingFundMeBalance &&
                              endingDeployerBalance
                          ) {
                              // Convert balance values to BigInt
                              const startingFundMeBalanceBN = BigInt(
                                  startingFundMeBalance.toString()
                              )
                              const startingDeployerBalanceBN = BigInt(
                                  startingDeployerBalance.toString()
                              )
                              const endingFundMeBalanceBN = BigInt(
                                  endingFundMeBalance.toString()
                              )
                              const endingDeployerBalanceBN = BigInt(
                                  endingDeployerBalance.toString()
                              )

                              // Assert
                              const endingFundMeBalance =
                                  await ethers.provider.getBalance(
                                      fundMe.target
                                  )
                              const endingDeployerBalance =
                                  await ethers.provider.getBalance(deployer)
                              assert.equal(endingFundMeBalanceBN, BigInt(0))
                              assert.equal(
                                  (
                                      startingFundMeBalanceBN +
                                      startingDeployerBalanceBN
                                  ).toString(),
                                  (endingDeployerBalanceBN + gasCost).toString()
                              )
                          } else {
                              console.error(
                                  "One or more balance values are undefined."
                              )
                          }
                      } else {
                          console.error("Gas values are undefined or null.")
                      }
                  }

                  // Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  try {
                      await fundMeConnectedContract.withdraw()
                      // If the transaction doesn't revert, this test should fail.
                      assert.fail("Transaction did not revert")
                  } catch (error) {
                      // Check if the error message contains "FundMe__NotOwner"
                      assert(
                          error.message.includes("FundMe__NotOwner"),
                          `Expected error message to contain "FundMe__NotOwner", but got: ${error.message}`
                      )
                  }
              })

              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  if (!transactionReceipt) {
                      console.error("Transaction receipt is undefined or null.")
                  } else {
                      const { gasUsed, effectiveGasPrice } = transactionReceipt

                      // Check if gasUsed and effectiveGasPrice are valid values
                      if (
                          gasUsed !== undefined &&
                          effectiveGasPrice !== undefined
                      ) {
                          // Convert gasUsed and effectiveGasPrice to BigInt
                          const gasUsedBN = BigInt(gasUsed.toString())
                          const effectiveGasPriceBN = BigInt(
                              effectiveGasPrice.toString()
                          )

                          // Calculate gasCost as a BigInt
                          const gasCost = gasUsedBN * effectiveGasPriceBN

                          // Retrieve and check if other balance values are defined
                          if (
                              startingFundMeBalance &&
                              startingDeployerBalance &&
                              endingFundMeBalance &&
                              endingDeployerBalance
                          ) {
                              // Convert balance values to BigInt
                              const startingFundMeBalanceBN = BigInt(
                                  startingFundMeBalance.toString()
                              )
                              const startingDeployerBalanceBN = BigInt(
                                  startingDeployerBalance.toString()
                              )
                              const endingFundMeBalanceBN = BigInt(
                                  endingFundMeBalance.toString()
                              )
                              const endingDeployerBalanceBN = BigInt(
                                  endingDeployerBalance.toString()
                              )

                              // Assert
                              const endingFundMeBalance =
                                  await ethers.provider.getBalance(
                                      fundMe.target
                                  )
                              const endingDeployerBalance =
                                  await ethers.provider.getBalance(deployer)
                              assert.equal(endingFundMeBalanceBN, BigInt(0))
                              assert.equal(
                                  (
                                      startingFundMeBalanceBN +
                                      startingDeployerBalanceBN
                                  ).toString(),
                                  (endingDeployerBalanceBN + gasCost).toString()
                              )
                          } else {
                              console.error(
                                  "One or more balance values are undefined."
                              )
                          }
                      } else {
                          console.error("Gas values are undefined or null.")
                      }
                  }

                  // Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
