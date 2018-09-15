---
layout: post
title: "Understanding monoids using Cats in Scala"
date: 2018-09-15 18:30:51 +530
tags: "scala, akka, java, lagom, spark"
categories: functional programming scala
---
In the previous post we learned about Semigroup, In this post, we will see what are Monoids and how to use them.

**What is Monoid**

Wikipedia says In abstract algebra, a branch of mathematics, a monoid is an algebraic structure with a single associative binary operation and an identity element. We saw from the previous post on Semigroup that Semigroup also has a single associative operation. So monoids are similar to Semigroup but it has an identity element and a monoid definition in Scala look like as below. Here empty method refers to identity element.

{% highlight scala %}

trait Monoid[A]
{
  val empty: A
  def combine(a: A, b:A): A
}
{% endhighlight %}


A Monoid has the same operation as we have with Semigroup and if we have a Semigroup available for a particular datatype we can rewrite monoid definition as below.

{% highlight scala %}
trait Semigroup[A] {
  def combine(x: A, y: A): A
}
trait Monoid[A] extends Semigroup[A] {
  def empty: A
}
{% endhighlight %}

In cats, we already have monoid inbuilt for some datatypes. First, add cats to your SBT project.

{% highlight scala %}
libraryDependencies += "org.typelevel" %% "cats-core" % "1.2.0"
{% endhighlight %}

As usual, we need to add below cats imports to work with a monoid

{% highlight scala %}
import cats.Monoid
import cats.implicits._
{% endhighlight %}

Monoid instance for primitive types are already available in cats and can be used as below. Monoid has an identity element by definition and if you will combine another operand with it you will get the same as you can see in below code.

{% highlight scala %}
val intMonoid = Monoid[Int]
val strMonoid = Monoid[String]
val listMonoid = Monoid[List[Int]]

assert(intMonoid.combine(1,3) == 4)
assert(strMonoid.combine("Hello ", "World") == "Hello World")
assert(listMonoid.combine(List(1, 2, 3), List(4, 5, 6)) == List(1, 2, 3, 4, 5, 6))

assert(intMonoid.combine(1, intMonoid.empty) == 1)
assert(strMonoid.combine("Hello World", strMonoid.empty) == "Hello World")
assert(listMonoid.combine(List(1, 2, 3), listMonoid.empty) == List(1, 2, 3))
{% endhighlight %}

In the previous post on Semigroup, we demonstrate a banking transaction App to combine the credit, debit and final balance using reduceLeft. But what will happen if we find that there are no transactions in personal account then what we will return a result? Here monoid can solve our problem as it has an identity element.

{% highlight scala %}
object TransactionType extends Enumeration {
  type TRANSXN = Value
  val CREDIT = Value("Credit")
  val DEBIT = Value("Debit")
  val INVALID_OR_NO_TRANSACTION = Value("InvalidOrNoTransaction")
}
{% endhighlight %}

Create a case class to represent the transaction class.

{% highlight scala %}
case class Transaction(transactionType: TransactionType.TRANSXN, amount: Double)
{% endhighlight %}

Now write monoids to combine all credit, debit and calculate final balance.

{% highlight scala %}

object CombineAllCredit extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

   override def combine(a: Transaction, b: Transaction): Transaction = {
    if(b.transactionType == TransactionType.CREDIT)
    {
      a.copy(transactionType = TransactionType.CREDIT, amount = a.amount + b.amount)
    } else {
      a
    }
  }
}

object CombineAllDebit extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

  override def combine(a: Transaction, b: Transaction): Transaction = {
    if(b.transactionType == TransactionType.DEBIT)
    {
      a.copy(transactionType = TransactionType.DEBIT, amount = a.amount + b.amount)
    } else {
      a
    }
  }
}

object Finalbalance extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

  override def combine(a: Transaction, b: Transaction): Transaction = {
    if (b.transactionType == TransactionType.DEBIT) {
      a.copy(amount = a.amount - b.amount)
    }
    else if (b.transactionType == TransactionType.CREDIT) {
      a.copy(amount = a.amount + b.amount)
    } else {
      a
    }
  }
}
{% endhighlight %}

Now we can create a function to generate the final report. In case of the no transaction if we use reduceLeft we will get a java.lang.UnsupportedOperationException: empty.reduceLeft but we will use foldleft and return an identity element as we have a monoid instance.

{% highlight scala %}
object reportSevice {
  def report(transactions: Seq[Transaction]) = {
    val Transaction(TransactionType.CREDIT, totalCredit) = transactions.foldLeft(CombineAllCredit.empty)(CombineAllCredit.combine)
    val Transaction(TransactionType.DEBIT, totalDebit)  =  transactions.foldLeft(CombineAllDebit.empty)(CombineAllDebit.combine)
    val Transaction(_, finalbalance) = transactions.foldLeft(Finalbalance.empty)(Finalbalance.combine)
    s"Total Credit is $totalCredit and total debit is $totalDebit and final Balance is $finalbalance"
  }
}
{% endhighlight %}

Now create some transactions and see the output.

{% highlight scala %}

val transactions = List(
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 40.0),
  Transaction(TransactionType.CREDIT, 200.0),
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 50.0),
  Transaction(TransactionType.DEBIT, 50.0),
  Transaction(TransactionType.CREDIT, 300.0),
  Transaction(TransactionType.DEBIT, 100.0),
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 25.0)
)
 println(reportSevice.report(transactions))
 {% endhighlight %}

Please find the code through [repo](https://github.com/scalamill/cats-in-practice/blob/master/src/main/scala/com/scalamill/meow/Monoid.scala)
